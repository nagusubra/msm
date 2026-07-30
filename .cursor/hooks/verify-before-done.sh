#!/usr/bin/env bash
# Stop hook — evidence-before-done, mechanically enforced.
#
# If this session edited src/ or scripts/ and no verification command has run
# since the LAST such edit, block the stop ONCE with a reminder. Advisory with
# teeth: after one block the model either verifies or explains why it doesn't
# apply. Never loops (stop_hook_active short-circuits).
#
# Also screens the working diff for the two known autonomous failure modes here:
# net-deleted test assertions, and money literals landing in JSX.
set -uo pipefail

raw="$(cat)"
command -v jq >/dev/null 2>&1 || exit 0
active="$(printf '%s' "$raw" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)"
[ "$active" = "true" ] && exit 0

proj="${CURSOR_PROJECT_DIR:-${CLAUDE_PROJECT_DIR:-.}}"

if command -v git >/dev/null 2>&1 && [ -d "$proj/.git" ]; then
  removed="$(git -C "$proj" diff HEAD -- 'src/lib/__tests__/*' '*test*.ts' 2>/dev/null | grep -c '^-.*expect(' || true)"
  added="$(git -C "$proj" diff HEAD -- 'src/lib/__tests__/*' '*test*.ts' 2>/dev/null | grep -c '^+.*expect(' || true)"
  if [ "${removed:-0}" -gt "$(( ${added:-0} + 3 ))" ]; then
    echo "Test-integrity check: this session's diff net-deletes ${removed} assertion lines (added ${added}). Weakening or deleting tests to go green is forbidden — restore equivalents, or state precisely why each removal is correct." >&2
    exit 2
  fi
  lits="$(git -C "$proj" diff HEAD -- 'src/app/*.tsx' 'src/components/*.tsx' 2>/dev/null \
    | grep -E '^\+' | grep -vE '^\+\s*(//|\*)' | grep -nE '\$[0-9]' | head -5 || true)"
  if [ -n "$lits" ]; then
    echo "Money-literal check: this session's diff adds hardcoded money to rendered files. Every on-screen figure must trace to an engine function (docs/numbers.md is the source of truth, the engine is the renderer of it):
$lits" >&2
    exit 2
  fi
fi

_verify_stamp="$proj/.cursor/.last-verify"

_needs_verify_after_edit() {
  local changed newest
  changed="$(git -C "$proj" diff HEAD --name-only -- 'src/' 'scripts/' 2>/dev/null | head -1 || true)"
  [ -n "$changed" ] || return 1
  newest="$(git -C "$proj" diff HEAD --name-only -- 'src/' 'scripts/' 2>/dev/null \
    | while IFS= read -r p; do [ -f "$proj/$p" ] && stat -f '%m %N' "$proj/$p"; done \
    | sort -rn | head -1 | cut -d' ' -f1 || true)"
  [ -n "$newest" ] || return 1
  [ ! -f "$_verify_stamp" ] && return 0
  local stamp
  stamp="$(cat "$_verify_stamp" 2>/dev/null || echo 0)"
  [ "${stamp:-0}" -lt "${newest:-0}" ]
}

tp="$(printf '%s' "$raw" | jq -r '.transcript_path // empty' 2>/dev/null || true)"
if [ -f "$tp" ]; then
  window="$(tail -c 800000 "$tp" 2>/dev/null || true)"
  if [ -n "$window" ]; then
    last_edit="$(printf '%s' "$window" | grep -n '"file_path":"[^"]*/\(src\|scripts\)/[^"]*\.\(ts\|tsx\|css\)"' | tail -1 | cut -d: -f1 || true)"
    if [ -n "$last_edit" ]; then
      last_verify="$(printf '%s' "$window" | grep -nE 'npm (run )?(check|test|typecheck|lint|build|analyze|reconcile|backtest)|vitest run|tsc --noEmit' | tail -1 | cut -d: -f1 || true)"
      if [ -z "$last_verify" ] || [ "$last_verify" -lt "$last_edit" ]; then
        echo "Code under src/ or scripts/ was edited after the last verification. Before finishing: run the scoped check (npm test / npm run typecheck, or npm run check), READ the output, and report the actual result — or state explicitly why verification does not apply to this change." >&2
        exit 2
      fi
    fi
  fi
elif _needs_verify_after_edit; then
  echo "Code under src/ or scripts/ changed since the last npm run check/test. Before finishing: run npm run check (or a scoped npm test / npm run typecheck), READ the output, and report the actual result — or state explicitly why verification does not apply." >&2
  exit 2
fi
exit 0
