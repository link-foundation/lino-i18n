#!/usr/bin/env bash
set -euo pipefail
checked=0
for directory in bin src scripts tests examples; do
  [ -d "$directory" ] || continue
  while IFS= read -r -d '' file; do
    node --check "$file"
    checked=$((checked + 1))
  done < <(find "$directory" -type d -name node_modules -prune -o -type f \( -name '*.js' -o -name '*.mjs' -o -name '*.cjs' \) -print0)
done
printf 'Syntax checked %s JavaScript files.\n' "$checked"
