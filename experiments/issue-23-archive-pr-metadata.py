#!/usr/bin/env python3
"""Losslessly bundle fresh PR run details without exceeding GitHub's diff limit."""
import hashlib
import json
from pathlib import Path
import tarfile
import io

github = Path(__file__).resolve().parents[1] / "dev/log/issues/23/pulls/24/github"
archive = github / "pr-run-details.tar.gz"
records = {}
if archive.exists():
    with tarfile.open(archive) as bundle:
        records = {member.name: bundle.extractfile(member).read() for member in bundle}
paths = sorted(github.glob("pr-run-*.json"))
records.update({path.name: path.read_bytes() for path in paths})
with tarfile.open(archive, "w:gz") as bundle:
    for name, data in sorted(records.items()):
        member = tarfile.TarInfo(name)
        member.size = len(data)
        bundle.addfile(member, io.BytesIO(data))
index = [{"member": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
         for name, data in sorted(records.items())]
with tarfile.open(archive) as bundle:
    for entry in index:
        data = bundle.extractfile(entry["member"]).read()
        assert len(data) == entry["bytes"]
        assert hashlib.sha256(data).hexdigest() == entry["sha256"]
(github / "pr-run-details-index.json").write_text(json.dumps(index, indent=2) + "\n")
for path in paths:
    path.unlink()
print(f"Preserved and verified {len(records)} full PR run records.")
