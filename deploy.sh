#!/bin/bash
# Deploys teachingphysics.ch: every app, the privacy page, KaTeX and the hub page (index.html and
# lang.js at the web root), with rsync. Only changed files are sent (by checksum) and nothing on
# the server is deleted; the admin panel's data (hub-data/) is never touched.
#   ./deploy.sh            deploy
#   ./deploy.sh --dry-run  only list what would change
# DEPLOY_TARGET is where the web root is (default: the SSH host infomaniak_vps). The GitHub
# Action (.github/workflows/deploy.yml) deploys as the user tpdeploy, whose key may only run
# rsync into the web root (rrsync), so its target is relative to it: tpdeploy@host:
# Not deployed here: the admin service (hub-admin/, needs sudo) and nginx (a new app needs its
# location block first); see hub-admin/hub-admin.service.
set -euo pipefail
cd "$(dirname "$0")"
TARGET="${DEPLOY_TARGET:-infomaniak_vps:/var/www/teachingphysics/}"
DRY=""
[ "${1:-}" = "--dry-run" ] && DRY="--dry-run"

# local folder:path on the server (the energy app is served at /coe)
APPS="bulb-brightness circuit-trainer force-concepts force-systems impedance induction-match motion-graphs rl-switch torque energy-conservation:coe privacy katex"

shared/sync.sh --check >/dev/null || { echo "Shared files differ: run shared/sync.sh first." >&2; exit 1; }

# -c: compare by checksum; no times, owners or groups are set (the folders' setgid bit gives new
# files the group tpweb). With GNU rsync, files are 664 and folders 2775, so that the deploy user
# and the admin can both update them; macOS's openrsync lacks --chmod (new folders are then only
# writable by whoever deployed them first).
RSYNC=(rsync -rlc --omit-dir-times --exclude test/ --exclude .DS_Store --out-format="%n" $DRY)
if rsync --version 2>/dev/null | grep -q openrsync; then
  echo "(openrsync: new folders will not be group-writable; GNU rsync sets that)" >&2
else
  RSYNC+=(--perms --chmod=D2775,F664)
fi

# one rsync per folder; stops at the first error
send() {
  local out
  if ! out=$("${RSYNC[@]}" "$@" 2>&1); then
    echo "$out" >&2
    echo "rsync failed: $*" >&2
    exit 1
  fi
  printf '%s\n' "$out" | grep -v '/$' | grep -v '^$' || true
}
for a in $APPS; do
  src=${a%%:*} dst=${a##*:}
  send "$src/" "$TARGET$dst/" | sed "s|^|$dst/|"
done
send hub/index.html hub/lang.js "$TARGET"
echo "${DRY:+(dry run) }deployed to $TARGET"
