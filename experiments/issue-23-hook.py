#!/usr/bin/env python3
"""Ensure the actual pre-commit hook runs checks even with a large staged list."""
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="lino-hook-") as temporary:
    cwd = Path(temporary)
    for directory in ["js", "scripts", "bin"]:
        (cwd / directory).mkdir()
    (cwd / "scripts/check-file-line-limits.py").write_text("")
    (cwd / "bin/git").write_text(
        '#!/usr/bin/env python3\nimport os,sys\n'
        'if sys.argv[1] == "rev-parse": print(os.environ["HOOK_FIXTURE"])\n'
        'else: print("js/src/index.js\\nrust/src/lib.rs\\n" + "archive/evidence-file\\n" * 10000)\n'
    )
    for tool in ["npm", "cargo"]:
        (cwd / "bin" / tool).write_text(
            '#!/usr/bin/env python3\nimport os,sys\n'
            'with open(os.environ["HOOK_CALLS"], "a") as f: f.write(" ".join(sys.argv) + "\\n")\n'
        )
    for path in (cwd / "bin").iterdir():
        path.chmod(0o755)
    calls = cwd / "calls.txt"
    result = subprocess.run(
        ["bash", str(ROOT / ".githooks/pre-commit")], text=True, capture_output=True,
        env={**os.environ, "PATH": f"{cwd / 'bin'}:{os.environ['PATH']}",
             "HOOK_FIXTURE": temporary, "HOOK_CALLS": str(calls)},
    )
    print(result.stdout + result.stderr)
    recorded = calls.read_text()
    print(recorded)
    assert result.returncode == 0
    for expected in ["run check", "run test:types", "fmt --manifest-path", "clippy --locked"]:
        assert expected in recorded, f"Hook skipped {expected} for a large staged list"
print("Pre-commit checks run for a large staged file list.")
