#!/bin/bash
# Print the page's console (log / warn / error / uncaught) from a headless run.
#   tools/console.sh "nomusic=1&u=.3&debug=1" [real_ms=60000]
# Works through ?log=1 (js/boot.js mirrors the console into <pre id="__log">).
Q=$1; B=${2:-60000}
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --user-data-dir="$(mktemp -d)" \
  --window-size=1280,800 --timeout="$B" --dump-dom "http://localhost:${PORT:-8765}/?log=1&$Q" 2>/dev/null \
  | python3 -c "import sys,re,html; d=sys.stdin.read(); m=re.search(r'<pre id=\"__log\"[^>]*>(.*?)</pre>', d, re.S); print(html.unescape(m.group(1)) if m else 'NO LOG (page did not boot?)')"
