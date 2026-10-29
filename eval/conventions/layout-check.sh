#!/bin/sh
# Fails when a package file or node_modules exists at the root or under app/, or when app/ holds
# any file or symbolic link other than the three of the layout, or when one of the three is a
# symbolic link.
cd "$(dirname "$0")/../.." || exit 2

status=0

for name in package.json package-lock.json node_modules; do
  if [ -e "$name" ]; then
    echo "layout: $name exists at the root"
    status=1
  fi
done

if [ -d app ]; then
  banned=$(find app \( -name package.json -o -name package-lock.json -o -name node_modules \))
  if [ -n "$banned" ]; then
    echo "$banned" | while IFS= read -r path; do
      echo "layout: $path must not exist under app/"
    done
    status=1
  fi

  for path in app/shelf.mjs app/src/shelf.mjs app/src/store.mjs; do
    if [ -L "$path" ]; then
      echo "layout: $path is a symbolic link"
      status=1
    fi
  done

  extra=$(find app \( -type f -o -type l \) | while IFS= read -r path; do
    case "$path" in
      (app/shelf.mjs | app/src/shelf.mjs | app/src/store.mjs) ;;
      (*) echo "layout: $path is not one of app/shelf.mjs, app/src/shelf.mjs, app/src/store.mjs" ;;
    esac
  done)
  if [ -n "$extra" ]; then
    echo "$extra"
    status=1
  fi
fi

exit "$status"
