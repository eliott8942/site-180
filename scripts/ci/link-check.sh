#!/usr/bin/env bash
set -euo pipefail
SUBPATH="${1:-test}"
SOURCE_DIR="public"
PORT="${LINT_LINKS_PORT:-8099}"

# Pick a package runner: explicit override via RUNNER, else bun if
# available, else fall back to npx (node).
RUNNER="${RUNNER:-}"
if [ -z "$RUNNER" ]; then
  if command -v bun >/dev/null 2>&1; then
    RUNNER="bun x"
  else
    RUNNER="npx"
  fi
fi

# Strip any leading/trailing slashes the caller might pass by mistake.
SUBPATH="${SUBPATH#/}"
SUBPATH="${SUBPATH%/}"

# Reject path traversal (e.g. "../../etc") before it's used in a path.
if [[ "$SUBPATH" == *..* ]]; then
  echo "error: invalid subpath '$SUBPATH'" >&2
  exit 1
fi

# Unique tmp dir so concurrent runs don't collide or clobber each other.
TMP_DIR="$(mktemp -d)"
TARGET_DIR="$TMP_DIR"
[ -n "$SUBPATH" ] && TARGET_DIR="$TMP_DIR/$SUBPATH"

cleanup() {
  local exit_code=$?
  # Negative PID kills the whole process group (setsid below), so the
  # actual http-server gets killed even if bun x forked a child for it.
  [ -n "${SERVER_PID:-}" ] && kill -- "-$SERVER_PID" 2>/dev/null || true
  rm -rf "$TMP_DIR"
  exit "$exit_code"
}
trap cleanup EXIT

mkdir -p "$TARGET_DIR"
cp -r "$SOURCE_DIR/." "$TARGET_DIR/"

setsid $RUNNER http-server "$TMP_DIR" -p "$PORT" --silent &
SERVER_PID=$!

# Poll until the server accepts connections; fail clearly if it never does.
for _ in $(seq 1 20); do
  curl -s -o /dev/null "http://localhost:$PORT/" && break
  sleep 0.25
done
curl -s -o /dev/null "http://localhost:$PORT/" || { echo "error: server never started" >&2; exit 1; }

URL="http://localhost:$PORT"
[ -n "$SUBPATH" ] && URL="$URL/$SUBPATH"

$RUNNER linkinator "$URL" --recurse --check-css