#!/bin/bash
# Syntax-check every module with macOS JavaScriptCore (no node needed). Prints nothing but "ok" when clean.
cd "$(dirname "$0")/../public/js" || exit 1
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
T=$(mktemp); for f in $(find . -name "*.js" | sort); do echo "try { new Function(read('$f')); } catch (e) { print('SYNTAX $f: ' + e); }"; done > "$T"
OUT=$("$JSC" "$T"); rm -f "$T"; if [ -n "$OUT" ]; then echo "$OUT"; exit 1; fi; echo "ok ($(find . -name '*.js' | wc -l | tr -d ' ') modules)"
