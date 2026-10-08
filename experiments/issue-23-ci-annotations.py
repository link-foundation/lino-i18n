#!/usr/bin/env python3
"""Run real CI fixtures and reject leaked GitHub workflow commands."""
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
command = re.compile(
    r"::(?:error|warning|notice|debug|group|endgroup|add-mask|stop-commands|"
    r"add-matcher|remove-matcher|echo|set-output|save-state|set-env|add-path)"
    r"(?: [^\r\n]*?)?::", re.IGNORECASE)
fixtures = ("rust-release", "rust-guards", "rust-output", "rust-io", "shared-guards")
for fixture in fixtures:
    result = subprocess.run([sys.executable, str(ROOT / f"experiments/issue-23-{fixture}.py")],
                            cwd=ROOT, env={**os.environ, "RUST_LOG": "error"},
                            text=True, capture_output=True)
    output = result.stdout + result.stderr
    # Keep even a reproducing failure from creating annotations in this test.
    print(f"{fixture}: exit {result.returncode}\n{output.replace('::', ': :')}", flush=True)
    assert result.returncode == 0, f"Fixture failed: {fixture}"
    assert not command.search(output), f"Fixture leaked a workflow command: {fixture}"
print("All CI fixtures passed without emitting live workflow commands.")
