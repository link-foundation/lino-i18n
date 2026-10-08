#!/usr/bin/env python3
"""Preserve reproducible GitHub evidence for issue 23 without exposing credentials."""

import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "dev/log/issues/23/pulls/24"


def gh(*args):
    return subprocess.check_output(["gh", *args])


def collect_template(language):
    repo = f"link-foundation/{language}-ai-driven-development-pipeline-template"
    tree = json.loads((DEST / f"templates/{language}-tree.json").read_text())
    sha = tree["sha"]
    files = [item["path"] for item in tree["tree"] if item["type"] == "blob"]
    (DEST / f"templates/{language}-file-tree.txt").write_text("\n".join(files) + "\n")
    selected = [
        name for name in files
        if name.startswith((".github/", "scripts/", ".husky/"))
        or name in ("package.json", "Cargo.toml", "deno.json", "eslint.config.js",
                    ".jscpd.json", ".prettierignore", ".prettierrc.json",
                    ".secretlintrc.json", "rustfmt.toml", "clippy.toml")
    ]
    with tempfile.TemporaryFile() as archive:
        result = subprocess.run(["gh", "api", f"repos/{repo}/tarball/{sha}"], stdout=archive)
        result.check_returncode()
        archive.seek(0)
        with tarfile.open(fileobj=archive) as tar:
            for member in tar.getmembers():
                name = member.name.partition("/")[2]
                if name in selected and member.isfile():
                    target = DEST / "templates" / language / name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(tar.extractfile(member).read())
    return {"repo": repo, "sha": sha, "files": len(files), "preserved": selected}


def collect_run(run):
    run_id = run["databaseId"]
    workflow = run["workflowName"].lower().replace(" ", "-")
    stem = f"{workflow}-{run_id}"
    metadata = DEST / f"github/{stem}.json"
    metadata.write_bytes(gh("run", "view", str(run_id), "--repo", "link-foundation/lino-i18n",
                           "--json", "databaseId,headSha,createdAt,updatedAt,conclusion,jobs,url"))
    log = DEST / f"ci-logs/{stem}.log"
    with log.open("wb") as stdout, log.with_suffix(".stderr").open("wb") as stderr:
        result = subprocess.run(["gh", "run", "view", str(run_id), "--repo",
                                 "link-foundation/lino-i18n", "--log"], stdout=stdout, stderr=stderr)
    return {**run, "download_exit_code": result.returncode, "log": str(log.relative_to(ROOT)),
            "bytes": log.stat().st_size, "sha256": hashlib.sha256(log.read_bytes()).hexdigest()}


def main():
    runs = json.loads((DEST / "github/main-runs-initial.json").read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        templates = list(pool.map(collect_template, ["js", "rust"]))
        results = list(pool.map(collect_run, runs))
    (DEST / "templates/manifest.json").write_text(json.dumps(templates, indent=2) + "\n")
    (DEST / "ci-logs/manifest.json").write_text(json.dumps(results, indent=2) + "\n")
    print(f"Preserved {len(templates)} pinned templates and {len(results)} CI runs")


if __name__ == "__main__":
    main()
