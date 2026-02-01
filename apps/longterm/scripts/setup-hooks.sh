#!/bin/sh
# Sets up git hooks for the longterm wiki

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOKS_DIR="$SCRIPT_DIR/hooks"

# Find the git root (could be parent directories for monorepo)
GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$GIT_ROOT" ]; then
  echo "Not in a git repository, skipping hook setup"
  exit 0
fi
GIT_HOOKS_DIR="$GIT_ROOT/.git/hooks"

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Install pre-commit hook
if [ -f "$HOOKS_DIR/pre-commit" ]; then
  cp "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
  chmod +x "$GIT_HOOKS_DIR/pre-commit"
  echo "✅ Installed pre-commit hook"
else
  echo "⚠️  pre-commit hook not found in scripts/hooks/"
fi

echo "Git hooks setup complete"
