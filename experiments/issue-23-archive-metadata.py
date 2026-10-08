#!/usr/bin/env python3
"""Preserve expired historical run metadata while keeping GitHub's diff reviewable."""
import hashlib
import json
from pathlib import Path
import tarfile

destination = Path(__file__).resolve().parents[1] / "dev/log/issues/23/pulls/24"
github = destination / "github"
index_path = github / "historical-run-details-index.json"
archive = github / "historical-run-details.tar.gz"
if not archive.exists():
    manifest = json.loads((destination / "ci-logs/manifest.json").read_text())
    paths = [github / f"{run['workflowName'].lower().replace(' ', '-')}-{run['databaseId']}.json"
             for run in manifest if run["download_exit_code"] != 0]
    assert len(paths) == 24 and all(path.is_file() for path in paths)
    index = [{"member": path.name, "bytes": path.stat().st_size,
              "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in paths]
    with tarfile.open(archive, "w:gz") as bundle:
        for path in paths:
            bundle.add(path, arcname=path.name)
    index_path.write_text(json.dumps(index, indent=2) + "\n")
with tarfile.open(archive) as bundle:
    for entry in json.loads(index_path.read_text()):
        data = bundle.extractfile(entry["member"]).read()
        assert len(data) == entry["bytes"]
        assert hashlib.sha256(data).hexdigest() == entry["sha256"]
        path = github / entry["member"]
        if path.exists():
            assert path.read_bytes() == data
            path.unlink()
print("Verified and preserved 24 historical run detail records.")
