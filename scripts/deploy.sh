#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: deploy.sh <preview|production> \"<message>\""
  exit 1
}

[[ $# -lt 2 ]] && usage

CHANNEL=$1
MESSAGE=$2

if [[ "$CHANNEL" != "preview" && "$CHANNEL" != "production" ]]; then
  echo "Error: channel must be 'preview' or 'production'" >&2
  exit 1
fi

echo "Pushing OTA update to channel: $CHANNEL"
echo "Message: $MESSAGE"
echo ""

eas update --channel "$CHANNEL" --message "$MESSAGE" --non-interactive

echo ""
echo "Done. View updates at: https://expo.dev/accounts/souravdg777/projects/road/updates"
