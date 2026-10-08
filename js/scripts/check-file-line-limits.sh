#!/usr/bin/env bash
set -euo pipefail
repository=$(git rev-parse --show-toplevel)
cd "$repository"
exec python3 scripts/check-file-line-limits.py
