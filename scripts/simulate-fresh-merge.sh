#!/usr/bin/env bash
set -euo pipefail
: "${BASE_REF:?Set BASE_REF to the pull request base branch}"
git config user.email 'github-actions[bot]@users.noreply.github.com'
git config user.name 'github-actions[bot]'
git fetch origin "$BASE_REF"
git merge --no-edit "origin/$BASE_REF"
