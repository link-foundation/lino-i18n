#!/usr/bin/env bash
set -euo pipefail
case "${1:?Specify npm or crates}" in
  npm)
    if [ -z "${ACTIONS_ID_TOKEN_REQUEST_URL:-}" ] || [ -z "${ACTIONS_ID_TOKEN_REQUEST_TOKEN:-}" ]; then
      echo '::error::npm trusted publishing requires id-token: write on this job.'
      exit 1
    fi
    echo 'OIDC wiring is present. npm has no read-only API that proves publish authorization; the authenticated publish remains authoritative.'
    ;;
  crates)
    status=0
    node scripts/crates-publish-preflight.mjs lino-i18n-macros || status=1
    node scripts/crates-publish-preflight.mjs lino-i18n || status=1
    exit "$status"
    ;;
  *) echo 'Unknown registry'; exit 1 ;;
esac
