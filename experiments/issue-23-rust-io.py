#!/usr/bin/env python3
"""Require Rust validation helpers to reject unreadable inputs in finite fixtures."""
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
failures = []
for helper in ["get-bump-type", "check-file-size"]:
    with tempfile.TemporaryDirectory(prefix="lino-rust-io-") as temporary:
        cwd = Path(temporary)
        (cwd / "Cargo.toml").write_text('[package]\nname="fixture"\nversion="1.0.0"\n')
        if helper == "get-bump-type":
            (cwd / "changelog.d").write_text("a file cannot be a fragment directory")
        else:
            (cwd / "invalid.rs").write_bytes(b"\xff")
        result = subprocess.run(
            ["rust-script", str(ROOT / f"rust/scripts/{helper}.rs")],
            cwd=cwd, text=True, capture_output=True,
            env={**os.environ, "RUST_LOG": "error", "RUSTFLAGS": "-Dwarnings", "GITHUB_OUTPUT": ""},
        )
        diagnostic = (result.stdout + result.stderr).replace("::", ": :")
        print(f"{helper}: exit={result.returncode}\n{diagnostic}")
        if result.returncode == 0:
            failures.append(helper)
assert not failures, f"Helpers passed without checking their inputs: {failures}"
print("Rust input read failures are fatal.")
