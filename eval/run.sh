#!/bin/sh
# The acceptance tests' entry point. Run with `sh eval/run.sh`; the root is found from this file.
# Its exit status is the verdict. It writes eval/report/rows.txt.
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

rm -rf eval/report
mkdir -p eval/report

# The conventions step (not a row). The guard: with no .mjs file under app/ there is nothing to check.
mjs_files=""
if [ -d app ]; then
  mjs_files=$(find app -name '*.mjs' -type f)
fi

if [ -z "$mjs_files" ]; then
  echo "conventions: app/ is absent or holds no .mjs file; nothing to check"
else
  npm ci --prefix eval/conventions --no-audit --no-fund --loglevel=error
  eval/conventions/node_modules/.bin/eslint --config eval/conventions/eslint.config.mjs --no-config-lookup app
  eval/conventions/node_modules/.bin/prettier --check --config eval/conventions/prettierrc.json --ignore-path eval/conventions/prettierignore --no-editorconfig app
  sh eval/conventions/forbidden-in-app.sh
  sh eval/conventions/layout-check.sh
fi

# The deferred list is read once, before any row runs, into a copy in the report directory.
# A line with a row id and a D-<k> word defers that row; any other line defers nothing.
deferred_ids=""
if [ -f eval/deferred.txt ]; then
  cp eval/deferred.txt eval/report/deferred-read.txt
  deferred_ids=$(awk '
    { sub(/\r$/, "") }
    /^[ \t]*(#|$)/ { next }
    {
      id = $1
      rest = $0
      sub(/^[ \t]*[^ \t]+/, "", rest)
      if (rest ~ /(^|[^A-Za-z0-9_])D-[0-9]+([^A-Za-z0-9_]|$)/) print id
    }
  ' eval/report/deferred-read.txt)
fi

# A pattern that matches the whole id at the start of a test name, with the id escaped.
pattern_for() {
  escaped=$(printf '%s' "$1" | sed 's/[][\.*^$()+?{}|-]/\\&/g')
  printf '^%s( |$)' "$escaped"
}

# The verdict run: every row except the deferred ones. Its exit status is the verdict.
set -- --test --test-reporter=tap
for id in $deferred_ids; do
  set -- "$@" "--test-skip-pattern=$(pattern_for "$id")"
done
set +e
node "$@" eval/tests/*.test.mjs > eval/report/tap.txt 2> eval/report/node-test.stderr
verdict=$?
set -e

# The report run: the deferred rows only. Its exit status is ignored.
if [ -n "$deferred_ids" ]; then
  set -- --test --test-reporter=tap
  for id in $deferred_ids; do
    set -- "$@" "--test-name-pattern=$(pattern_for "$id")"
  done
  set +e
  node "$@" eval/tests/*.test.mjs > eval/report/tap-deferred.txt 2> eval/report/node-test-deferred.stderr
  set -e
fi

POD_VERDICT_STATUS="$verdict" node eval/tap-to-rows.mjs

if grep -q '^fail ' eval/report/rows.txt; then
  exit 1
fi
if [ "$verdict" -ne 0 ]; then
  exit 1
fi
exit 0
