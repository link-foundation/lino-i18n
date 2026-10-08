#!/usr/bin/env python3
"""A missing Actions output must fail the step, rather than silently skip release."""
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="lino-output-") as temporary:
    result = subprocess.run(
        ["rust-script", str(ROOT / "rust/scripts/get-version.rs")],
        cwd=ROOT, text=True, capture_output=True,
        env={**os.environ, "RUST_LOG": "error", "GITHUB_OUTPUT": temporary},
    )
    print(result.stdout + result.stderr)
    assert result.returncode != 0, "The version step passed despite an unwritable output file"
print("Unwritable Actions output correctly fails the step.")
