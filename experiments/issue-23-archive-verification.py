#!/usr/bin/env python3
"""Preserve final local check outputs with checksums and a reviewable file count."""
import hashlib
import io
import json
from pathlib import Path
import tarfile

directory = Path(__file__).resolve().parents[1] / "dev/log/issues/23/pulls/24/verification"
archive = directory / "final-checks.tar.gz"
records = {}
if archive.exists():
    with tarfile.open(archive) as bundle:
        records = {entry.name: bundle.extractfile(entry).read() for entry in bundle}
paths = sorted(directory.glob("final-*.log"))
records.update({path.name: path.read_bytes() for path in paths})
with tarfile.open(archive, "w:gz") as bundle:
    for name, data in sorted(records.items()):
        entry = tarfile.TarInfo(name)
        entry.size = len(data)
        bundle.addfile(entry, io.BytesIO(data))
index = [{"member": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
         for name, data in sorted(records.items())]
with tarfile.open(archive) as bundle:
    for entry in index:
        data = bundle.extractfile(entry["member"]).read()
        assert len(data) == entry["bytes"]
        assert hashlib.sha256(data).hexdigest() == entry["sha256"]
(directory / "final-checks-index.json").write_text(json.dumps(index, indent=2) + "\n")
for path in paths:
    path.unlink()
print(f"Preserved and verified {len(records)} final local check outputs.")
