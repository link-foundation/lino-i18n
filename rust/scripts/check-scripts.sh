#!/usr/bin/env bash
set -euo pipefail
export RUSTFLAGS="${RUSTFLAGS:--Dwarnings}"
cd "$(dirname "$0")"
export CARGO_TARGET_DIR="$(git rev-parse --show-toplevel)/rust/target/ci-scripts"
for script in *.rs; do
  case "$script" in rust-paths.rs|git-changes.rs|registry-state.rs|github-output.rs) continue ;; esac
  echo "Checking $script (including its unit tests)"
  rustfmt --check "$script"
  package=$(rust-script --package "$script")
  cargo check --manifest-path "$package/Cargo.toml" --all-targets
  cargo test --manifest-path "$package/Cargo.toml"
done
