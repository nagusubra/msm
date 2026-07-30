#!/usr/bin/env bash
# Cursor afterShellExecution — stamp last verification so stop hook can enforce npm run check.
set -uo pipefail

raw="$(cat)"
command -v jq >/dev/null 2>&1 || exit 0
cmd="$(printf '%s' "$raw" | jq -r '.command // empty' 2>/dev/null || true)"
[ -n "$cmd" ] || exit 0

case "$cmd" in
  *npm\ run\ check*|*npm\ run\ test*|*npm\ run\ typecheck*|*npm\ run\ lint*|*npm\ run\ build*|*npm\ run\ analyze*|*npm\ run\ reconcile*|*npm\ run\ backtest*|*npm\ test*|*vitest\ run*|*tsc\ --noEmit*)
    mkdir -p .cursor
    date +%s > .cursor/.last-verify
    ;;
esac
exit 0
