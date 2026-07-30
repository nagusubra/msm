# Shared path extractor for Cursor hook JSON shapes.
_extract_path_from_hook_json() {
  local raw="$1"
  command -v jq >/dev/null 2>&1 || return 1
  jq -r '
    .tool_input.file_path //
    .tool_input.path //
    .file_path //
    .path //
    .arguments.path //
    empty
  ' <<< "$raw" 2>/dev/null
}
