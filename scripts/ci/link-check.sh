#!/usr/bin/env bash
set -euo pipefail

SUBPATH="${1:-test}"
SOURCE_DIR="public"
TMP_DIR="linkcheck-tmp"
PORT="${LINT_LINKS_PORT:-8099}"

# Strip any leading/trailing slashes the caller might pass by mistake.
SUBPATH="${SUBPATH#/}"
SUBPATH="${SUBPATH%/}"

TARGET_DIR="$TMP_DIR"
if [ -n "$SUBPATH" ]; then
  TARGET_DIR="$TMP_DIR/$SUBPATH"
fi

cleanup() {
  local exit_code=$?
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
  rm -rf "$TMP_DIR"
  exit "$exit_code"
}
trap cleanup EXIT

mkdir -p "$TARGET_DIR"
cp -r "$SOURCE_DIR/." "$TARGET_DIR/"

bun x http-server "$TMP_DIR" -p "$PORT" --silent &
SERVER_PID=$!

# Poll until the server actually accepts connections instead of a flat sleep.
for _ in $(seq 1 20); do
  if curl -s -o /dev/null "http://localhost:$PORT/"; then
    break
  fi
  sleep 0.25
done

URL="http://localhost:$PORT"
if [ -n "$SUBPATH" ]; then
  URL="$URL/$SUBPATH"
fi

bun x linkinator "$URL" --recurse --check-css