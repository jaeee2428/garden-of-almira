#!/bin/bash
# Double-click me: starts the garden and opens it in your browser.
cd "$(dirname "$0")"
( sleep 1; open "http://localhost:8765" ) &
python3 server.py
