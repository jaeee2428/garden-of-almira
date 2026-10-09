#!/bin/bash
# Studio portraits of every hero flower into public/flowers/<id>/renders/<label>-{plant,close}.png
#   tools/flower-archive.sh before            (all 18)      tools/flower-archive.sh after rosal pukingan   (just these)
# Two Chrome renders at a time (software GL is slow: ~2-4 min each). Start the server first.
cd "$(dirname "$0")/.." || exit 1
LABEL=${1:-current}; shift
IDS="$*"
[ -z "$*" ] && IDS=$(sed -n "s/^const FLOWERS = \[\(.*\)\];/\1/p" public/js/boot.js | tr -d "'" | tr ',' ' ')
for id in $IDS; do
  D=public/flowers/$id/renders; mkdir -p "$D"
  tools/shot.sh "$D/$LABEL-plant.png" "hideui=1&nomusic=1&notitle=1&u=.2&specimen=$id" 260000 900,900 &
  tools/shot.sh "$D/$LABEL-close.png" "hideui=1&nomusic=1&notitle=1&u=.2&specimen=$id&close=1" 260000 900,900 &
  wait
done
echo "archive done: $LABEL"
