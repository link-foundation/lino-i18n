#!/usr/bin/env python3
"""Reproduce output-write false success in the archived upstream template."""
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="lino-template-output-") as temporary:
    cwd = Path(temporary)
    script_dir = cwd / "scripts"
    script_dir.mkdir()
    archive_path = ROOT / "dev/log/issues/23/pulls/24/templates/rust-source.tar.gz"
    with tarfile.open(archive_path) as archive:
        for name in ["get-version.rs", "rust-paths.rs"]:
            content = archive.extractfile(f"rust/scripts/{name}").read()
            (script_dir / name).write_bytes(content)
    script = script_dir / "get-version.rs"
    (cwd / "Cargo.toml").write_text('[package]\nname="fixture"\nversion="1.0.0"\n')
    result = subprocess.run(["rust-script", str(script)], cwd=cwd, text=True, capture_output=True,
                            env={**os.environ, "RUST_LOG": "error", "GITHUB_OUTPUT": temporary})
    print(result.stdout + result.stderr)
    assert result.returncode == 0, "Pinned upstream reproduction changed"
    assert "Could not write to GITHUB_OUTPUT" in result.stderr
print("Confirmed: upstream returns success without supplying the required version output.")
