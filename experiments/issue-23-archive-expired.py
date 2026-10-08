#!/usr/bin/env python3
"""Losslessly bundle expired GitHub log downloads to keep PR diffs usable."""
import hashlib
import json
from pathlib import Path
import tarfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "dev/log/issues/23/pulls/24/ci-logs"
manifest = json.loads((DEST / "manifest.json").read_text())
expired = DEST / "expired"
expired.mkdir(exist_ok=True)
archive_path = DEST / "expired-log-downloads.tar.gz"
with tarfile.open(archive_path, "w:gz") as archive:
    for item in manifest:
        if item["download_exit_code"] == 0:
            continue
        filename = Path(item["log"]).name
        stderr_name = Path(filename).with_suffix(".stderr").name
        for name in (filename, stderr_name):
            source = DEST / name
            retained = expired / source.name
            if source.exists():
                source.rename(retained)
            archive.add(retained, arcname=retained.name)
        errors = (expired / stderr_name).read_bytes()
        item.update({"archive": str(archive_path.relative_to(ROOT)),
                     "archive_member": filename,
                     "stderr_archive_member": stderr_name,
                     "download_error": errors.decode(),
                     "stderr_sha256": hashlib.sha256(errors).hexdigest()})
(DEST / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Archived {sum(item['download_exit_code'] != 0 for item in manifest)} expired downloads")
