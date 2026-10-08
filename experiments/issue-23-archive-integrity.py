#!/usr/bin/env python3
"""Verify every bundled verification/run record and downloaded CI log."""
import hashlib
import json
from pathlib import Path
import tarfile

ROOT = Path(__file__).resolve().parents[1]
evidence = ROOT / "dev/log/issues/23/pulls/24"
for parent, stem in (("github", "historical-run-details"), ("github", "pr-run-details"),
                     ("verification", "final-checks"), ("verification", "local-history")):
    entries = json.loads((evidence / parent / f"{stem}-index.json").read_text())
    with tarfile.open(evidence / parent / f"{stem}.tar.gz") as archive:
        indexed = set()
        for entry in entries:
            member = entry.get("member", entry.get("name"))
            data = archive.extractfile(member).read()
            assert len(data) == entry["bytes"]
            assert hashlib.sha256(data).hexdigest() == entry["sha256"], member
            indexed.add(member)
        assert indexed == {entry.name for entry in archive if entry.isfile()}, stem
    print(f"{stem}: {len(entries)} members verified", flush=True)
archived_members = {}
for entry in json.loads((evidence / "ci-logs/manifest.json").read_text()):
    if entry.get("archive_member"):
        members = archived_members.setdefault(entry["archive"], set())
        members.add(entry["archive_member"])
        with tarfile.open(ROOT / entry["archive"]) as archive:
            data = archive.extractfile(entry["archive_member"]).read()
            if entry.get("stderr_archive_member"):
                members.add(entry["stderr_archive_member"])
                errors = archive.extractfile(entry["stderr_archive_member"]).read()
                assert hashlib.sha256(errors).hexdigest() == entry["stderr_sha256"]
    else:
        data = (ROOT / entry["log"]).read_bytes()
    assert len(data) == entry["bytes"]
    assert hashlib.sha256(data).hexdigest() == entry["sha256"], entry["databaseId"]
for path, members in archived_members.items():
    with tarfile.open(ROOT / path) as archive:
        assert members == {member.name for member in archive if member.isfile()}, path
print("Every CI log and expired-download error has its original bytes and checksum.")
