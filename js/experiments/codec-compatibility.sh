#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
package_dir=$PWD
codec_version=${1:-}
consumer=$(mktemp -d)
trap 'rm -rf "$consumer"' EXIT

npm pack --json --pack-destination "$consumer" > "$consumer/pack.json"
cp experiments/codec-consumer.mjs "$consumer/"
cd "$consumer"
printf '{"private":true}\n' > package.json
dependencies=(./lino-i18n-*.tgz)
if [[ -n "$codec_version" ]]; then
  dependencies+=("lino-objects-codec@$codec_version")
fi

npm install --engine-strict --ignore-scripts --no-audit --no-fund "${dependencies[@]}"
npm ls lino-objects-codec --all
npm exec --offline -- lino-i18n extract --in "$package_dir/examples/next-usage" --out locales
node codec-consumer.mjs "$codec_version" "$package_dir/locales/en.lino"
