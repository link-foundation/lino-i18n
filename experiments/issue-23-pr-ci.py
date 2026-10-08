#!/usr/bin/env python3
"""Preserve current PR CI identities, completed logs and checksums."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "dev/log/issues/23/pulls/24"
REPO = "link-foundation/lino-i18n"
BRANCH = "issue-23-bc288e2f1144"
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--label", required=True)
parser.add_argument("--sha")
args = parser.parse_args()
sha = args.sha or subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
fields = "databaseId,conclusion,createdAt,headSha,status,workflowName,url"
raw = subprocess.check_output(["gh", "run", "list", "--repo", REPO, "--branch", BRANCH,
                               "--limit", "5", "--json", fields], text=True)
(DEST / "github" / f"branch-runs-{args.label}.json").write_text(raw)
manifest_path = DEST / "ci-logs/manifest.json"
manifest = json.loads(manifest_path.read_text())
indexed = {item["databaseId"]: item for item in manifest}
for run in json.loads(raw):
    if run["headSha"] != sha:
        print(f"Ignoring older SHA: {run['databaseId']} {run['headSha']}")
        continue
    identity = str(run["databaseId"])
    details = subprocess.check_output(["gh", "run", "view", identity, "--repo", REPO,
                                       "--json", "status,conclusion,jobs,headSha,createdAt,url"], text=True)
    (DEST / "github" / f"pr-run-{identity}.json").write_text(details)
    data = json.loads(details)
    run.update({key: data[key] for key in ["status", "conclusion"]})
    print(f"{run['workflowName']} {identity}: {run['status']} {run['conclusion']}")
    if run["status"] != "completed":
        continue
    filename = f"{run['workflowName'].lower()}-{identity}.log"
    log = DEST / "ci-logs" / filename
    if not log.exists() or not log.stat().st_size:
        with log.open("wb") as output, Path(str(log) + ".stderr").open("wb") as errors:
            result = subprocess.run(["gh", "run", "view", identity, "--repo", REPO, "--log"],
                                    stdout=output, stderr=errors)
        code = result.returncode
        if code == 0:
            Path(str(log) + ".stderr").unlink()
    else:
        code = 0
    indexed[run["databaseId"]] = {**run, "download_exit_code": code,
        "log": str(log.relative_to(ROOT)), "bytes": log.stat().st_size,
        "sha256": hashlib.sha256(log.read_bytes()).hexdigest()}
manifest_path.write_text(json.dumps(list(indexed.values()), indent=2) + "\n")
