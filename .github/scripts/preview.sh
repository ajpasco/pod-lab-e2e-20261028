#!/usr/bin/env bash
# pod-preview: runs one pull request's own acceptance tests against main's app/, as information
# for the founder before approving. Runs from main's copy of this repository (the enforcer); the
# pull request's tree is data, and its code runs with no token in its environment, as in the gate.
# It writes nothing to GitHub: its exit code is the result, and its last line says why.
#   preview.sh <pr number> <enforcer checkout> <subject checkout>
# A packet lands a later story's rows before the story, so those rows are meant to fail against
# main's app/. It says so in eval/stories/<n>.expect, one `fail <id>` line per row, and the preview
# is "as expected", exit 0, when the rows that fail are exactly those (decision 18).
set -euo pipefail
PR="$1"; ENFORCER="$2"; SUBJECT="$3"; REPO="$GITHUB_REPOSITORY"

HEAD_SHA=$(git -C "$SUBJECT" rev-parse HEAD)
MAIN_SHA=$(git -C "$ENFORCER" rev-parse HEAD)
HEAD_REF=$(gh pr view "$PR" --repo "$REPO" --json headRefName -q .headRefName)
echo "pod-preview: eval/ from #$PR ($HEAD_REF) at $HEAD_SHA, app/ from main at $MAIN_SHA"

# The scratch tree, the gate's shape with the sides swapped: the pull request's eval/ and the
# files it travels with, main's app/. A packet changes docs/eval-plan.md together with its rows,
# and a project's eval/run.sh may read it, so the pull request's docs/ goes with its eval/. A rows
# file committed by mistake is removed, so the only one read is the one this run writes.
WORK=$(mktemp -d)
cp -R "$SUBJECT/eval" "$WORK/eval"
for f in package.json package-lock.json; do [ -f "$SUBJECT/$f" ] && cp "$SUBJECT/$f" "$WORK/"; done
[ -d "$SUBJECT/docs" ] && cp -R "$SUBJECT/docs" "$WORK/docs"
if [ -d "$ENFORCER/app" ]; then cp -R "$ENFORCER/app" "$WORK/app"; else mkdir -p "$WORK/app"; fi
ROWS="$WORK/eval/report/rows.txt"; rm -f "$ROWS"
if (cd "$WORK" && env -u GH_TOKEN -u GITHUB_TOKEN sh eval/run.sh) > "$WORK/eval.log" 2>&1; then pass=1; else pass=0; fi

# The rows file, eval/run.sh's report: one line per row, `pass <id>`, `fail <id> <reason>` or
# `deferred <id> D-<k> <reason>`. The preview reads the file and parses no test framework's output,
# so it works for any stack. Its absence refuses nothing by itself. The app under test can write the
# file, so it is read once into a copy with its control characters removed and each line cut to 300
# characters, as in the gate. A deferred row is a failing row eval/deferred.txt names, which the
# runner did not count against its exit status; it is listed after the failing rows and is not one
# of them. A row the list names that passed gets a line: its defect may be fixed.
if [ -f "$ROWS" ]; then
  LC_ALL=C tr -d '\000-\010\013-\037\177' < "$ROWS" | LC_ALL=C cut -c1-300 > "$WORK/rows.txt"; ROWS="$WORK/rows.txt"
  ndef=$(grep -c '^deferred ' "$ROWS" || true)
  echo "--- rows: $(grep -c '^pass ' "$ROWS" || true) pass, $(grep -c '^fail ' "$ROWS" || true) fail$([ "$ndef" = 0 ] || echo ", $ndef deferred") (eval/report/rows.txt)"
  grep '^fail ' "$ROWS" || true
  if [ "$ndef" -gt 0 ]; then echo "--- deferred: $ndef failing rows eval/deferred.txt defers, not counted as failing"; grep '^deferred ' "$ROWS"; fi
  if [ -f "$SUBJECT/eval/deferred.txt" ]; then
    fixed=$(awk 'FILENAME == ARGV[1] { sub(/\r$/, ""); r = $0; sub(/^[ \t]*[^ \t]+/, "", r); if ($0 !~ /^[ \t]*(#|$)/ && r ~ /(^|[^A-Za-z0-9_])D-[0-9]+([^A-Za-z0-9_]|$)/) d[$1] = 1; next } $1 == "pass" && ($2 in d) { print $2 }' "$SUBJECT/eval/deferred.txt" "$ROWS" | sort -u)
    if [ -n "$fixed" ]; then echo "--- note: eval/deferred.txt names $(wc -l <<<"$fixed" | tr -d ' ') rows that pass, so their defects may be fixed: $(paste -sd' ' - <<<"$fixed")"; fi
  fi
else
  echo "--- rows: the runner wrote no eval/report/rows.txt; see the log tail"
fi
echo "--- eval log (tail)"; tail -n 60 "$WORK/eval.log"; echo "---"

# The expectations: the eval/stories/<n>.expect files this pull request adds or changes against
# main. One already on main belongs to a story built or in flight, and does not count here.
BASE=$(git -C "$SUBJECT" merge-base origin/main HEAD)
EXPECTS=()
while IFS= read -r f; do EXPECTS+=("$f"); done < <(git -C "$SUBJECT" diff --name-only --diff-filter=d "$BASE" HEAD -- 'eval/stories/*.expect')
: > "$WORK/expected"; malformed=
for f in ${EXPECTS[@]+"${EXPECTS[@]}"}; do
  awk '{ sub(/\r$/, "") } /^[[:space:]]*(#|$)/ { next } $1 == "fail" && NF == 2 { print $2; next } { exit 1 }' "$SUBJECT/$f" >> "$WORK/expected" || malformed="$malformed $f"
done
sort -u -o "$WORK/expected" "$WORK/expected"
count() { wc -l < "$1" | tr -d ' '; }
rows() { if [ "$(count "$1")" = 1 ]; then echo "1 row"; else echo "$(count "$1") rows"; fi; }
# A list of ids for the verdict line, ten at most; the lines above it list them all.
ids() { head -n 10 "$1" | tr '\n' ' ' | sed 's/ $//'; [ "$(count "$1")" -le 10 ] || printf ' ...'; }

# With no expectation, the verdict is the exit code, as it always was. With one, the run must fail,
# leave a rows file, and fail on exactly the rows the .expect files name, no more and no fewer.
verdict=fail; why=
if [ -n "$malformed" ]; then
  why="not as expected:$malformed has a line that is not 'fail <id>'"
elif [ ! -s "$WORK/expected" ]; then
  if [ $pass = 1 ]; then verdict=pass; fi
elif [ ! -f "$ROWS" ]; then
  why="not as expected: the runner wrote no eval/report/rows.txt, so its failures cannot be checked against ${EXPECTS[*]}"
else
  # Only `fail` lines are failing rows: a deferred row is not one, so a .expect that names it is unmet.
  awk '$1 == "fail" { print $2 }' "$ROWS" | sort -u > "$WORK/failing"
  comm -23 "$WORK/failing" "$WORK/expected" > "$WORK/unexpected"
  comm -13 "$WORK/failing" "$WORK/expected" > "$WORK/unmet"
  if [ $pass = 0 ] && [ ! -s "$WORK/unexpected" ] && [ ! -s "$WORK/unmet" ]; then
    verdict="as expected"; why="$(rows "$WORK/expected") fail ($(echo "${EXPECTS[*]}" | sed 's/ /, /g')), every other row passes"
  else
    echo "--- not as expected (${EXPECTS[*]})"
    sed 's/^/fails, and no .expect names it: /' "$WORK/unexpected"
    sed 's/^/named in a .expect, and did not fail: /' "$WORK/unmet"
    parts=()
    if [ -s "$WORK/unexpected" ]; then parts+=("$(rows "$WORK/unexpected") failing that no .expect names: $(ids "$WORK/unexpected")"); fi
    if [ -s "$WORK/unmet" ]; then parts+=("$(rows "$WORK/unmet") named in a .expect that did not fail: $(ids "$WORK/unmet")"); fi
    [ ${#parts[@]} -gt 0 ] || parts+=("the run passed, though its rows file shows the expected rows failing")
    why="not as expected: $(printf '%s; ' "${parts[@]}" | sed 's/; $//')"
  fi
fi

case "$verdict" in
  pass) echo "pod-preview: pass for #$PR at $HEAD_SHA: this pull request's acceptance tests pass against main's app/";;
  "as expected") echo "pod-preview: as expected for #$PR at $HEAD_SHA: $why";;
  *) echo "pod-preview: fail for #$PR at $HEAD_SHA: ${why:-this pull request's acceptance tests FAIL against main's app/}";;
esac
[ "$verdict" != fail ]
