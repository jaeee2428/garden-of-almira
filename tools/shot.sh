#!/bin/bash
# Headless screenshot of the running garden (start the server first: python3 server.py)
#   tools/shot.sh out.png "hideui=1&nomusic=1&u=.45" [real_ms=150000] [W,H=1280,800]
# Software GL (SwiftShader) is slow: one shot can take a few minutes. Add &log=1&showlog=1 to see the console.
# Headless Chrome sometimes never exits after writing the image, so this script stops it itself.
OUT=$1; Q=$2; B=${3:-150000}; WH=${4:-1280,800}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
rm -f "$OUT"; DIR=$(mktemp -d)
"$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars \
  --user-data-dir="$DIR" --window-size="$WH" --timeout="$B" \
  --screenshot="$OUT" "http://localhost:${PORT:-8765}/?$Q" >/dev/null 2>&1 &
PID=$!; LIMIT=$(( B / 1000 + 120 )); T=0
while kill -0 $PID 2>/dev/null; do
  if [ -s "$OUT" ]; then sleep 2; break; fi
  sleep 2; T=$((T + 2)); [ $T -ge $LIMIT ] && break
done
pkill -f "user-data-dir=$DIR" 2>/dev/null; kill $PID 2>/dev/null
[ -s "$OUT" ] && echo "wrote $OUT" || echo "FAILED $OUT"
