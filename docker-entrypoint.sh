#!/bin/sh
set -e

# Ensure svgs directory exists (permissions depend on host volume mount)
mkdir -p /app/svgs || true

# Ensure JSON files exist with valid content if they're empty or don't exist
if [ ! -f /app/artwork-emails.json ] || [ ! -s /app/artwork-emails.json ]; then
  echo '[]' > /app/artwork-emails.json 2>/dev/null || true
fi

if [ ! -f /app/eepmon-news-subscribers.json ] || [ ! -s /app/eepmon-news-subscribers.json ]; then
  echo '[]' > /app/eepmon-news-subscribers.json 2>/dev/null || true
fi

if [ ! -f /app/artwork-counter.json ] || [ ! -s /app/artwork-counter.json ]; then
  echo '{"count":0}' > /app/artwork-counter.json 2>/dev/null || true
fi

# Execute the main command
exec "$@"

