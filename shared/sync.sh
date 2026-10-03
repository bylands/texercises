#!/bin/bash
# Copies the shared files (ui.css, lang.js, tutor.js, arcade.js) into every app, so that each app
# stays a self-contained folder for deployment. Edit the files here, never an app's copy.
#   shared/sync.sh          copy
#   shared/sync.sh --check  only report copies that differ (exit 1 if any)
set -e
cd "$(dirname "$0")/.."
# the apps that use the shared files so far
APPS="force-systems bulb-brightness circuit-trainer impedance"
FILES="ui.css lang.js tutor.js arcade.js"
status=0
for app in $APPS; do
  for f in $FILES; do
    if [ "$1" = "--check" ]; then
      if ! cmp -s "shared/$f" "$app/$f"; then echo "differs: $app/$f"; status=1; fi
    else
      cp "shared/$f" "$app/$f"
    fi
  done
done
[ "$1" = "--check" ] && [ $status = 0 ] && echo "all shared files in sync"
exit $status
