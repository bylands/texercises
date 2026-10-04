#!/bin/bash
# Copies the shared files (ui.css, lang.js, fit.js, tutor.js, arcade.js and the folder katex/) into every
# app, so that each app stays a self-contained folder for deployment; pages that are no app (the
# privacy page) get lang.js only. Edit the files here, never an app's copy.
#   shared/sync.sh          copy
#   shared/sync.sh --check  only report copies that differ (exit 1 if any)
# katex/ is KaTeX 0.16.9 (MIT, see katex/LICENSE) from cdnjs, with the woff2 fonts only (all
# current browsers load those); it is served with the apps, so that no page loads anything from
# another server.
set -e
cd "$(dirname "$0")/.."
APPS="force-systems bulb-brightness circuit-trainer impedance induction-match motion-graphs force-concepts"
FILES="ui.css lang.js fit.js tutor.js arcade.js"
PAGES="privacy"
status=0
copy() { # copy shared/$1 to $2/$1, or with --check report a difference
  if [ "$MODE" = "--check" ]; then
    if ! diff -rq "shared/$1" "$2/$1" >/dev/null 2>&1; then echo "differs: $2/$1"; status=1; fi
  elif [ -d "shared/$1" ]; then
    rm -rf "$2/$1"; cp -R "shared/$1" "$2/$1"
  else
    cp "shared/$1" "$2/$1"
  fi
}
MODE="$1"
for app in $APPS; do
  for f in $FILES katex; do copy "$f" "$app"; done
done
for page in $PAGES; do copy lang.js "$page"; done
[ "$MODE" = "--check" ] && [ $status = 0 ] && echo "all shared files in sync"
exit $status
