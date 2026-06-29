#!/bin/bash
set -euo pipefail

# Copy the built site into the sibling homepage repo and publish it.
# Uses plain `git` (not interactive shell aliases) so it works under
# `npm run deploy` / non-interactive shells too.
rsync -av ./dist/ ../studio-esagames-homepage/fire-rogue/ --exclude fe-assets-db --exclude femp-backup

( cd ../studio-esagames-homepage/ &&
git add fire-rogue &&
git commit -m "chore: update fire-rogue deployment to latest version" &&
git push
)
