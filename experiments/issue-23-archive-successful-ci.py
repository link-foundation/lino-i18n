#!/usr/bin/env python3
"""Losslessly bundle successful PR logs while keeping failures directly readable."""
import hashlib
import io
import json
from pathlib import Path
import tarfile

ROOT = Path(__file__).resolve().parents[1]
evidence = ROOT / "dev/log/issues/23/pulls/24"
manifest_path = evidence / "ci-logs/manifest.json"
manifest = json.loads(manifest_path.read_text())
run_ids = {int(entry["member"].removeprefix("pr-run-").removesuffix(".json"))
           for entry in json.loads((evidence / "github/pr-run-details-index.json").read_text())}
archive_path = evidence / "ci-logs/pr-successful-logs.tar.gz"
records = {}
if archive_path.exists():
    with tarfile.open(archive_path) as archive:
        records = {entry.name: archive.extractfile(entry).read() for entry in archive}
paths = []
for entry in manifest:
    if entry["databaseId"] not in run_ids or entry["conclusion"] != "success" or entry["download_exit_code"]:
        continue
    path = ROOT / entry["log"]
    if path.exists():
        records[path.name] = path.read_bytes()
        paths.append(path)
    data = records[path.name]
    assert len(data) == entry["bytes"]
    assert hashlib.sha256(data).hexdigest() == entry["sha256"], path.name
    entry.update(archive=str(archive_path.relative_to(ROOT)), archive_member=path.name)
with tarfile.open(archive_path, "w:gz") as archive:
    for name, data in sorted(records.items()):
        member = tarfile.TarInfo(name)
        member.size = len(data)
        archive.addfile(member, io.BytesIO(data))
with tarfile.open(archive_path) as archive:
    for name, data in records.items():
        assert archive.extractfile(name).read() == data, name
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
for path in paths:
    path.unlink()
print(f"Preserved and verified {len(records)} successful PR logs.")
