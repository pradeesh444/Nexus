#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo 'Install Node.js 22 LTS or newer from https://nodejs.org, then run this file again.'
  read -r -p 'Press Enter to close.'
  exit 1
fi
if [ ! -d node_modules/express ]; then npm ci; fi
if [ ! -f dist/index.html ]; then npm run build; fi
printf '\nOpen http://localhost:4000 after the ready message. Keep this window open.\n'
npm start
