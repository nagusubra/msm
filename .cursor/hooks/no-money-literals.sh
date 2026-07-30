#!/usr/bin/env bash
# PostToolUse (Edit|Write) — the single highest-value rule in this repo is
# "every on-screen number traces to an engine function, zero literals in JSX".
# It is also the easiest one to violate while making a component look right.
# Advisory: warn on a money literal, a hardcoded hex, or a system-clock call in
# a rendered file, naming the file so it cannot be missed.
set -uo pipefail

raw="$(cat)"
# shellcheck source=_extract-path.sh
source "$(dirname "${BASH_SOURCE[0]}")/_extract-path.sh"
f="$(_extract_path_from_hook_json "$raw" || true)"
command -v jq >/dev/null 2>&1 || exit 0
[ -n "$f" ] || exit 0
[ -f "$f" ] || exit 0

case "$f" in
  *src/app/*.tsx|*src/components/*.tsx) ;;
  *src/lib/*.ts)
    if grep -nE 'new Date\(\)|Date\.now\(\)|Math\.random\(\)' "$f" >/dev/null 2>&1; then
      echo "engine purity: $f uses the system clock or randomness. 'Now' is a \`now: string\` parameter sourced from seed meta.today (2026-05-27T18:40) — the demo must produce identical numbers on any future date." >&2
    fi
    if grep -nE 'from ["'"'"']react|require\(["'"'"']react' "$f" >/dev/null 2>&1; then
      echo "engine purity: $f imports react. src/lib must stay pure (no react, no fetch, no fs) so scripts/ and tests can reuse it." >&2
    fi
    exit 0 ;;
  *) exit 0 ;;
esac

msg=""
# Money literals in rendered output: $12, $1,310.00, and bare 2-dp amounts in JSX text.
hits="$(grep -nE '\$[0-9]|[^a-zA-Z0-9_.]([0-9]{1,3}(,[0-9]{3})*\.[0-9]{2})[^0-9]' "$f" \
  | grep -vE '^[0-9]+:\s*(//|\*|/\*)' | head -5 || true)"
if [ -n "$hits" ]; then
  msg="$msg
money literals in $f — every on-screen figure must arrive as a prop from an engine call (formatMoney/solveGap/projectDays), never be typed in:
$hits"
fi
# Hardcoded color: tokens live in globals.css only.
hex="$(grep -nE '#[0-9a-fA-F]{3,8}\b' "$f" | head -3 || true)"
if [ -n "$hex" ]; then
  msg="$msg
hardcoded color in $f — use the tokens (--wage-amber confirmed, --pending-haze estimated/stale, --cliff-rust cliff+shortfall only):
$hex"
fi
clock="$(grep -nE 'new Date\(\)|Date\.now\(\)' "$f" | head -3 || true)"
if [ -n "$clock" ]; then
  msg="$msg
system clock in $f — 'now' is seed meta.today (2026-05-27T18:40), passed in as data."
fi

[ -n "$msg" ] && printf '%s\n' "$msg" >&2
exit 0
