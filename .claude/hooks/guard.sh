#!/bin/bash
# trend-watcher project-specific Bash guard (PreToolUse).
# Exit 2 = block, Exit 0 = allow.

set -eu

input=$(cat)
cmd=$(printf '%s' "$input" | python3 -c 'import json,sys
try:
  d=json.load(sys.stdin)
  print(d.get("tool_input",{}).get("command",""))
except Exception:
  pass' 2>/dev/null || true)

[ -z "$cmd" ] && exit 0

# Block direct writes to public/data/*.json from shell (atomic rename required).
# Only when > or tee appears as a real redirect, not inside quoted strings.
if printf '%s' "$cmd" | grep -qE '(^|[^"'"'"'])(>[[:space:]]*|tee[[:space:]]+(-a[[:space:]]+)?)[^"'"'"'|;&]*public/data/[^"'"'"'|;&[:space:]]+\.json'; then
  echo "BLOCKED: do not write public/data/*.json from shell — use atomic rename in code (CLAUDE.md)" >&2
  exit 2
fi

# Block force-adding out/ build artifacts
if printf '%s' "$cmd" | grep -qE '(^|[;&|][[:space:]]*)git[[:space:]]+add[[:space:]]+[^"'"'"']*(\./)?out/'; then
  echo "BLOCKED: out/ is gitignored — do not force-add (CLAUDE.md)" >&2
  exit 2
fi

# Block staging / committing .env
if printf '%s' "$cmd" | grep -qE '(^|[;&|][[:space:]]*)(git[[:space:]]+add|git[[:space:]]+commit)[^"'"'"']*[[:space:]](\./)?\.env([[:space:]]|$|\.)'; then
  echo "BLOCKED: do not stage/commit .env" >&2
  exit 2
fi

exit 0
