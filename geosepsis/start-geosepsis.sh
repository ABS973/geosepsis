#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
command -v node >/dev/null || { echo 'Install Node.js 20 or later first.'; exit 1; }
[[ -f dist/index.html ]] || npm run build
node scripts/server.mjs > /tmp/geosepsis-server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT INT TERM
for attempt in {1..50}; do
  if curl --silent --fail http://127.0.0.1:3000/ >/dev/null; then break; fi
  sleep 0.2
done
kill -0 "$SERVER_PID" 2>/dev/null || { cat /tmp/geosepsis-server.log; exit 1; }
curl --silent --fail http://127.0.0.1:3000/ >/dev/null || { echo 'Local server did not become ready.'; exit 1; }
if command -v chromium >/dev/null; then BROWSER_BIN=chromium
elif command -v chromium-browser >/dev/null; then BROWSER_BIN=chromium-browser
else echo 'Install Chromium using Raspberry Pi OS package manager.'; exit 1; fi
"$BROWSER_BIN" --kiosk --noerrdialogs --disable-infobars --no-first-run --user-data-dir=/tmp/geosepsis-kiosk-profile http://127.0.0.1:3000/
