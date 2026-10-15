#!/bin/bash
# Double-click in Finder to start the Stacks Browser and open it in your browser.
# (macOS may ask once: right-click → Open, or allow it in System Settings → Privacy & Security.)
cd "$(dirname "$0")" || exit 1
./bin/stacks "$@" || { echo; read -r -p "Press Return to close this window." _; exit 1; }
