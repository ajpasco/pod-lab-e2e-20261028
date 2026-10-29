#!/bin/sh
# Fails when anything under app/ names the acceptance tests' runner, reporter or report.
cd "$(dirname "$0")/../.." || exit 2

grep -rEnf eval/conventions/forbidden-in-app.txt app
found=$?

if [ "$found" -eq 0 ]; then
  echo "forbidden-in-app: app/ names the acceptance tests' runner, reporter or report (see above)"
  exit 1
fi
if [ "$found" -eq 1 ]; then
  exit 0
fi
echo "forbidden-in-app: grep failed with exit $found"
exit 1
