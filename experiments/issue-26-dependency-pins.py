#!/usr/bin/env python3
"""Each drift the dependency-pin guard targets must fail it on a copy of the repo."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
DRIFTS = {
    "a second checkout ref": (".github/workflows/docs.yml", "actions/checkout@v7", "actions/checkout@v6", "actions/checkout is pinned at 2"),
    "a second rust-script version": (".github/workflows/docs.yml", "rust-script --version 0.36.0", "rust-script --version 0.35.0", "rust-script is pinned at 2"),
    "an MSRV leg behind rust-version": (".github/workflows/rust.yml", "toolchain: '1.87'", "toolchain: '1.85'", "no MSRV leg"),
    "an engines floor without a leg": ("js/package.json", '"node": ">=22.11.0"', '"node": ">=20.0.0"', "no Node 20 leg"),
}


def run(cwd):
    return subprocess.run([sys.executable, str(ROOT / "scripts/check-dependency-pins.py"), str(cwd)],
                          text=True, capture_output=True)


assert run(ROOT).returncode == 0, run(ROOT).stdout
for drift, (name, old, new, message) in DRIFTS.items():
    with tempfile.TemporaryDirectory(prefix="lino-pins-") as temporary:
        cwd = Path(temporary)
        shutil.copytree(ROOT / ".github", cwd / ".github")
        for manifest in ["rust/Cargo.toml", "js/package.json"]:
            (cwd / manifest).parent.mkdir(exist_ok=True)
            shutil.copy(ROOT / manifest, cwd / manifest)
        text = (cwd / name).read_text()
        assert old in text, f"fixture is stale: {old!r} not in {name}"
        (cwd / name).write_text(text.replace(old, new, 1))
        result = run(cwd)
        assert result.returncode == 1 and message in result.stdout, (drift, result.stdout + result.stderr)
        print(f"rejected {drift}")
print("Every pinned-version drift is rejected.")
