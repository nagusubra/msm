#!/usr/bin/env bash
# SessionStart hook — open every session with repo state plus the two facts that
# are most often gotten wrong here: the frozen clock and the canonical shortfall.
set -euo pipefail
echo "— TILL · branch: $(git branch --show-current 2>/dev/null || echo '?') —"
status="$(git status --short 2>/dev/null | head -10 || true)"
if [ -n "$status" ]; then echo "$status"; else echo "(working tree clean)"; fi
echo "— recent commits —"
git log --oneline -5 2>/dev/null || true
echo "— invariants —"
echo "now = 2026-05-27T18:40 from seed meta.today (never new Date()) · shortfall = \$58.39 · canonical figures: docs/numbers.md · build order + status: docs/plan.md"
