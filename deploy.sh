#!/bin/bash

rsync -av ./* ../studio-esagames-homepage/fe-draft/ --exclude fe-assets-db && (cd ../studio-esagames-homepage/; ga; gcm "chore: update fe-draft deployment to latest version"; gps)
