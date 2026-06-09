#!/bin/bash
set -euo pipefail

# Copy the built site into the sibling homepage repo and publish it.
# Uses plain `git` (not interactive shell aliases) so it works under
# `npm run deploy` / non-interactive shells too.
rsync -av ./dist/ ../studio-esagames-homepage/fe-draft/ --exclude fe-assets-db --exclude femp-backup

( cd ../studio-esagames-homepage/ &&
git add fe-draft &&
git commit -m "chore: update fe-draft deployment to latest version" &&
git push
)
