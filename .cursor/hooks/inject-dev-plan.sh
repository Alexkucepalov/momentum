#!/usr/bin/env bash
# Inject living dogfood plan + agent rules into every agent session.
set -euo pipefail
cat >/dev/null
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PLAN="$ROOT/docs/17-DEV-PLAN.md"
AGENTS="$ROOT/AGENTS.md"
ADDITIONAL=""
if [[ -f "$PLAN" ]]; then
  ADDITIONAL+=$'\n'"--- docs/17-DEV-PLAN.md ---"$'\n'
  ADDITIONAL+="$(head -n 80 "$PLAN")"
fi
if [[ -f "$AGENTS" ]]; then
  ADDITIONAL+=$'\n'"--- AGENTS.md ---"$'\n'
  ADDITIONAL+="$(head -n 40 "$AGENTS")"
fi
# Escape for JSON string
python3 -c 'import json,sys; print(json.dumps({"additional_context": sys.stdin.read()}))' <<<"$ADDITIONAL"
