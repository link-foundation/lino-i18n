#!/usr/bin/env bash
set -euo pipefail
repository=$(git rev-parse --show-toplevel)
exec bash "$repository/scripts/simulate-fresh-merge.sh"
