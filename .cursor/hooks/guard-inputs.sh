#!/usr/bin/env bash
# PreToolUse (Edit|Write) — hard-block writes to read-only inputs and generated
# files. seed.json is the real dataset: editing a row to make a demo beat land
# is fabrication, and it is silent. cohort.json is produced by npm run analyze.
set -uo pipefail

raw="$(cat)"
# shellcheck source=_extract-path.sh
source "$(dirname "${BASH_SOURCE[0]}")/_extract-path.sh"
f="$(_extract_path_from_hook_json "$raw" || true)"
[ -n "$f" ] || exit 0

case "$f" in
  *public/seed.json)
    echo "BLOCKED: public/seed.json is a read-only input — the real W-0131 dataset. Do not add, edit, or round a row. If a number you need is not in it, the number is wrong, not the data. To change the dataset, the founder replaces the file." >&2
    exit 2 ;;
  *public/cohort.json)
    echo "BLOCKED: public/cohort.json is generated. Change scripts/analyze.ts and run 'npm run analyze' instead of hand-editing the output." >&2
    exit 2 ;;
  *docs/spec.md)
    echo "BLOCKED: docs/spec.md is the founder's build contract, kept verbatim for reference. Record decisions and deviations in docs/plan.md instead." >&2
    exit 2 ;;
esac
exit 0
