#!/bin/sh
# MV Travel MCP installer (macOS / Linux).
#   curl -fsSL https://raw.githubusercontent.com/talirezun/MV-MCP-server/main/install/install.sh | bash
#   curl -fsSL .../install.sh | bash -s -- --key XXX
# Checks for Node >= 18, fetches install.js to a temp dir and runs it.
# Everything lives inside main() so a truncated download can never run half a script.

main() {
  # BASE only locates install.js; the installer pins the server scripts itself.
  # MV_TRAVEL_INSTALL_BASE, when set by the caller, is passed through to install.js as-is.
  BASE="${MV_TRAVEL_INSTALL_BASE:-https://raw.githubusercontent.com/talirezun/MV-MCP-server/main}"
  BASE="${BASE%/}"

  need_node() {
    echo "MV Travel MCP installer needs Node.js 18 or newer."
    echo "Please install it from https://nodejs.org and run this command again."
    exit 1
  }

  # Installing as root would put configs in root's home, not yours.
  CURRENT_UID="${MV_TRAVEL_TEST_UID:-$(id -u)}"
  if [ "$CURRENT_UID" = "0" ] && [ "${MV_TRAVEL_ALLOW_ROOT:-}" != "1" ]; then
    echo "Please run this installer as your normal user, not as root (or sudo)."
    echo "(Set MV_TRAVEL_ALLOW_ROOT=1 to override.)"
    exit 1
  fi

  command -v node >/dev/null 2>&1 || need_node
  NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)
  case "$NODE_MAJOR" in ''|*[!0-9]*) need_node ;; esac
  [ "$NODE_MAJOR" -ge 18 ] || need_node

  TMP=$(mktemp -d 2>/dev/null || mktemp -d -t mvtravel) || { echo "Could not create a temp dir." >&2; exit 1; }
  trap 'rm -rf "$TMP"' EXIT
  trap 'exit 130' INT TERM

  URL="$BASE/install/install.js"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$URL" -o "$TMP/install.js" || { echo "Download failed: $URL" >&2; exit 1; }
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$TMP/install.js" "$URL" || { echo "Download failed: $URL" >&2; exit 1; }
  else
    echo "Need curl or wget to download the installer." >&2
    exit 1
  fi

  # When piped (curl | bash) stdin is the script, so attach the terminal for prompts.
  RC=0
  if ( : </dev/tty ) 2>/dev/null; then
    node "$TMP/install.js" "$@" </dev/tty || RC=$?
  else
    node "$TMP/install.js" "$@" || RC=$?
  fi
  exit "$RC"
}

main "$@"
