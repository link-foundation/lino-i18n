#!/usr/bin/env python3
"""Verify Cargo exposes the actual standalone helpers for semantic analysis."""
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--prepare", action="store_true")
args = parser.parse_args()
with tempfile.TemporaryDirectory(prefix="lino-codeql-manifests-") as temporary:
    scripts = Path(temporary) / "scripts"
    shutil.copytree(ROOT / "rust/scripts", scripts, ignore=shutil.ignore_patterns("Cargo.toml", "Cargo.lock", "target"))
    source_directory = scripts if args.prepare else ROOT / "rust/scripts"
    expected = {path.resolve() for path in source_directory.glob("*.rs")
                if re.search(r"^fn main\(", path.read_text(), re.MULTILINE)}
    if args.prepare:
        subprocess.run(["python3", str(ROOT / "scripts/prepare-codeql-rust.py"),
                        "--scripts-dir", str(scripts)], check=True)
        manifest = scripts / "Cargo.toml"
    else:
        manifest = ROOT / "rust/Cargo.toml"
    metadata = json.loads(subprocess.check_output(["cargo", "metadata", "--no-deps",
                                                  "--format-version", "1", "--manifest-path", str(manifest)], text=True))
    loaded = {Path(target["src_path"]).resolve() for package in metadata["packages"] for target in package["targets"]}
    missing = expected - loaded
    print(f"Executable helpers: {len(expected)}; included as Cargo targets: {len(expected & loaded)}", flush=True)
    assert not missing, "Semantic analysis lacks these helper targets: " + ", ".join(sorted(path.name for path in missing))
    assert expected, "No helpers were found for the regression fixture"
    print("Every executable helper is included in the semantic-analysis manifest.")
