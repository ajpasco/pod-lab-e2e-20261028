#!/usr/bin/env bash
# pod-gate: judges one pull request and writes the `pod-gate` check run on its head commit.
# Runs from main's copy of this repository (the enforcer); the pull request's tree is data.
#   gate.sh <pr number> <enforcer checkout> <subject checkout>
set -euo pipefail
PR="$1"; ENFORCER="$2"; SUBJECT="$3"; REPO="$GITHUB_REPOSITORY"

HEAD_SHA=$(git -C "$SUBJECT" rev-parse HEAD)
HEAD_REF=$(gh pr view "$PR" --repo "$REPO" --json headRefName -q .headRefName)
BASE=$(git -C "$SUBJECT" merge-base origin/main HEAD)
mapfile -t CHANGED < <(git -C "$SUBJECT" diff --name-only "$BASE" HEAD)
lines=(); fail=0

is_protected() { case "$1" in eval/*|.github/*|docs/*|.claude/*|package.json) return 0;; *) return 1;; esac; }

# 1. Scope. A story pull request (branch story/<n>) may change only what eval/stories/<n>.txt on
#    main allows, plus .pod/story-<n>/ for its builder's handoff note. Any other pull request may
#    change only protected paths. A pull request can change any number of files and GitHub limits
#    the check run's summary, so the summary names the first twenty outside, each line cut to 300
#    characters, and the log names them all.
nout=0
outside() {
  echo "scope: $1"; nout=$((nout + 1))
  if [ $nout -le 20 ]; then local l="scope: $1"; lines+=("${l:0:300}"); fi
}
story=$(sed -n 's#^story/\([0-9][0-9]*\).*#\1#p' <<<"$HEAD_REF")
if [ -n "$story" ]; then
  scope_file="$ENFORCER/eval/stories/$story.txt"
  if [ ! -f "$scope_file" ]; then
    lines+=("scope: story $story has no scope file on main"); fail=1
  else
    mapfile -t GLOBS < "$scope_file"; GLOBS+=(".pod/story-$story/*"); bad=0
    for p in "${CHANGED[@]}"; do
      ok=0; for g in "${GLOBS[@]}"; do [ -z "$g" ] && continue; case "$p" in $g) ok=1;; esac; done
      [ $ok = 1 ] || { outside "$p is outside story $story's scope (${GLOBS[*]})"; bad=1; }
    done
    if [ $bad = 1 ]; then fail=1; else lines+=("scope: all ${#CHANGED[@]} changed files are inside story $story's scope"); fi
  fi
else
  bad=0
  for p in "${CHANGED[@]}"; do is_protected "$p" || { outside "$p changed by a pull request that is not a story; only eval/, .github/, docs/, .claude/ and package.json may change here"; bad=1; }; done
  if [ $bad = 1 ]; then fail=1; else lines+=("scope: a non-story pull request touching protected paths only"); fi
fi

if [ $nout -gt 20 ]; then lines+=("scope: and $((nout - 20)) more files outside the scope; the run's log lists them all"); fi

# 2. Protected paths need the founder's approval on this exact commit: a commit status
#    pod/approval = success. A new push is a new commit with no status, so nothing stays approved
#    after it changes.
needs=0; for p in "${CHANGED[@]}"; do is_protected "$p" && needs=1; done
if [ $needs = 1 ]; then
  state=$(gh api "repos/$REPO/commits/$HEAD_SHA/status" -q '[.statuses[] | select(.context=="pod/approval")][0].state // empty' || true)
  if [ "$state" = "success" ]; then
    lines+=("approval: pod/approval is success on $HEAD_SHA")
  else
    lines+=("approval: waiting for the founder. This pull request changes a protected path and commit $HEAD_SHA carries no pod/approval status. The founder runs: pod-works approve $PR"); fail=1
  fi
fi

# 3. The acceptance tests, main's copy of eval/, against the pull request's app/. The pull
#    request's code runs with no token in its environment, so it cannot write a check run for
#    itself. A main with no eval/ at all is a project before its freeze: the pull request that
#    brings the tests is judged on scope and approval alone, and no story can pass meanwhile,
#    because its scope file lives under eval/ too. Main's docs/ goes with its eval/, as the
#    preview takes the pull request's: a runner may read docs/eval-plan.md, and a run that differs
#    from the preview's would pass a packet's preview and then fail every story at the gate.
if [ ! -d "$ENFORCER/eval" ]; then
  lines+=("eval: main has no eval/ yet, so there is nothing to run; the pull request that brings the acceptance tests is judged on scope and approval")
else
  WORK=$(mktemp -d)
  cp -R "$ENFORCER/eval" "$WORK/eval"
  for f in package.json package-lock.json; do [ -f "$ENFORCER/$f" ] && cp "$ENFORCER/$f" "$WORK/"; done
  [ -d "$ENFORCER/docs" ] && cp -R "$ENFORCER/docs" "$WORK/docs"
  if [ -d "$SUBJECT/app" ]; then cp -R "$SUBJECT/app" "$WORK/app"; else mkdir -p "$WORK/app"; fi
  ROWS="$WORK/eval/report/rows.txt"; rm -f "$ROWS"
  if (cd "$WORK" && env -u GH_TOKEN -u GITHUB_TOKEN sh eval/run.sh) > "$WORK/eval.log" 2>&1; then
    lines+=("eval: main's eval passes against this pull request's app/")
  else
    lines+=("eval: main's eval FAILS against this pull request's app/"); fail=1
  fi
  # The rows file, eval/run.sh's report: one line per row, `pass <id>`, `fail <id> <reason>` or
  # `deferred <id> D-<k> <reason>` (decision 18). The gate reads the file and parses no test framework's output, so it knows no
  # stack. The exit code above is the verdict; a missing file refuses nothing by itself. The check
  # run names the first twenty failing rows, which is what the founder and the builder read. The
  # file is written where the app under test can write, so it is read once into a copy with its
  # control characters removed and each line cut to 300 characters: a carriage return would break
  # a row across lines of the summary, and twenty long reasons could pass GitHub's limit on it.
  if [ -f "$ROWS" ]; then
    LC_ALL=C tr -d '\000-\010\013-\037\177' < "$ROWS" | LC_ALL=C cut -c1-300 > "$WORK/rows.txt"; ROWS="$WORK/rows.txt"
    npass=$(grep -c '^pass ' "$ROWS" || true); nfail=$(grep -c '^fail ' "$ROWS" || true); ndef=$(grep -c '^deferred ' "$ROWS" || true)
    counts="$npass pass, $nfail fail"; [ "$ndef" = 0 ] || counts="$counts, $ndef deferred"
    echo "--- rows: $counts (eval/report/rows.txt)"; grep -E '^(fail|deferred) ' "$ROWS" || true
    lines+=("eval: rows: $counts")
    while IFS= read -r row; do lines+=("eval: $row"); done < <(grep '^fail ' "$ROWS" | head -n 20)
    if [ "$nfail" -gt 20 ]; then lines+=("eval: and $((nfail - 20)) more failing rows; the run's log lists them all"); fi
    # A deferred row failed, and eval/deferred.txt names it beside its defect; the runner did not
    # count it against its exit status, so it is not a failing row here. It is listed apart, the
    # first twenty, so a known limitation stays in sight on every pull request. A row the list names
    # that passed gets a line too: its defect may be fixed, and its line in the list can go.
    if [ "$ndef" -gt 0 ]; then
      lines+=("eval: deferred: $ndef failing rows eval/deferred.txt defers, not counted as failing")
      while IFS= read -r row; do lines+=("eval: $row"); done < <(grep '^deferred ' "$ROWS" | head -n 20)
      if [ "$ndef" -gt 20 ]; then lines+=("eval: and $((ndef - 20)) more deferred rows; the run's log lists them all"); fi
    fi
    if [ -f "$ENFORCER/eval/deferred.txt" ]; then
      fixed=$(awk 'FILENAME == ARGV[1] { sub(/\r$/, ""); r = $0; sub(/^[ \t]*[^ \t]+/, "", r); if ($0 !~ /^[ \t]*(#|$)/ && r ~ /(^|[^A-Za-z0-9_])D-[0-9]+([^A-Za-z0-9_]|$)/) d[$1] = 1; next } $1 == "pass" && ($2 in d) { print $2 }' "$ENFORCER/eval/deferred.txt" "$ROWS" | sort -u)
      if [ -n "$fixed" ]; then
        nfixed=$(wc -l <<<"$fixed" | tr -d ' ')
        l="eval: note: eval/deferred.txt names $nfixed rows that pass, so their defects may be fixed: $(head -n 10 <<<"$fixed" | paste -sd' ' -)$([ "$nfixed" -le 10 ] || echo ' ...')"
        echo "--- ${l#eval: }"; lines+=("${l:0:300}")
      fi
    fi
  else
    echo "--- rows: the runner wrote no eval/report/rows.txt; see the log tail"
  fi
  echo "--- eval log (tail)"; tail -n 25 "$WORK/eval.log"; echo "---"
fi

# 4. The verdict, as a check run on the head commit, written by the Actions app.
if [ $fail = 0 ]; then conclusion=success; else conclusion=failure; fi
summary=$(printf '%s\n' "${lines[@]}")
gh api "repos/$REPO/check-runs" --method POST \
  -f name=pod-gate -f head_sha="$HEAD_SHA" -f status=completed -f conclusion="$conclusion" \
  -f "output[title]=pod-gate: $conclusion" -f "output[summary]=$summary" > /dev/null
echo "pod-gate: $conclusion for #$PR at $HEAD_SHA (${GITHUB_EVENT_NAME})"; printf '  %s\n' "${lines[@]}"
[ $fail = 0 ]
