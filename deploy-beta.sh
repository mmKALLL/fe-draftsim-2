#!/bin/bash
set -euo pipefail

# Copy the built site into the sibling homepage repo's beta folder and publish it.
# Serves at studioesagames.com/fire-rogue-beta. Uses plain `git` so it works under
# `npm run deploy:beta` / non-interactive shells too.
rsync -av ./dist/ ../studio-esagames-homepage/fire-rogue-beta/ --exclude fe-assets-db --exclude femp-backup

( cd ../studio-esagames-homepage/ &&
git add fire-rogue-beta &&
git commit -m "chore: update fire-rogue-beta deployment to latest version" &&
git push
)
