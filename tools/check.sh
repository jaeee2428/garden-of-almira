#!/bin/bash
# Syntax-check every module with macOS JavaScriptCore (no node needed). Prints nothing but "ok" when clean.
cd "$(dirname "$0")/../public" || exit 1
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
T=$(mktemp); for f in $(find js flowers -name "*.js" | sort); do echo "try { new Function(read('$f')); } catch (e) { print('SYNTAX $f: ' + e); }"; done > "$T"
OUT=$("$JSC" "$T"); rm -f "$T"; if [ -n "$OUT" ]; then echo "$OUT"; exit 1; fi
# code hidden behind an end-of-line // comment (parses fine, silently does nothing): a classic of scripted edits
SUS=$(for f in $(find js flowers -name "*.js"); do python3 - "$f" <<'PY'
import sys,re
f=sys.argv[1]
for n,l in enumerate(open(f),1):
    i=l.find('//')
    while i!=-1:
        b=l[:i]
        if b.count("'")%2==0 and b.count('`')%2==0 and b.count('"')%2==0 and not b.rstrip().endswith(':') and b.strip():
            r=l[i+2:]
            if re.search(r'[;}{)]\s*[}){]', r) or re.search(r';\s*(const |let |if \(|for \(|[A-Za-z_.\[\]]+\s*\(|[A-Za-z_.]+\s*\+?=[^=])', r): print(f"{f}:{n}: code after // comment")
            break
        i=l.find('//',i+2)
PY
done); if [ -n "$SUS" ]; then echo "$SUS"; exit 1; fi
echo "ok ($(find js flowers -name '*.js' | wc -l | tr -d ' ') modules)"
