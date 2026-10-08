#!/bin/bash
# Headless screenshot of the running garden (start the server first: python3 server.py)
#   tools/shot.sh out.png "hideui=1&nomusic=1&u=.45" [real_ms=60000] [W,H=1280,800]
# Software GL (SwiftShader) is slow: one shot can take a few minutes.
OUT=$1; Q=$2; B=${3:-60000}; WH=${4:-1280,800}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --user-data-dir="$(mktemp -d)" --window-size="$WH" --timeout="$B" \
  --screenshot="$OUT" "http://localhost:${PORT:-8765}/?$Q" >/dev/null 2>&1
echo "wrote $OUT"
