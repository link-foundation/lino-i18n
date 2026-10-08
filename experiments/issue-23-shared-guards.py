#!/usr/bin/env python3
"""Verify fail-closed release metadata and terminal statuses with local fixtures."""
import importlib.util
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("pipeline", ROOT / "scripts/check-pipeline-status.py")
pipeline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pipeline)
pipeline.check({"lint": {"result": "success"}, "release": {"result": "skipped"}})
for result in ("failure", "cancelled", "unknown", None):
    try:
        pipeline.check({"test": {"result": result}})
    except ValueError:
        pass
    else:
        raise AssertionError(f"Pipeline accepted {result}")
try:
    pipeline.check({})
except ValueError:
    pass
else:
    raise AssertionError("Empty dependency data was accepted")
pipeline.check({"test": {"result": "cancelled"}}, cancellable=["test"], superseded=True)
for job in ("release", "test"):
    try:
        pipeline.check({job: {"result": "cancelled"}}, cancellable=["test"], superseded=job == "release")
    except ValueError:
        pass
    else:
        raise AssertionError(f"Unexplained cancellation of {job} was accepted")

with tempfile.TemporaryDirectory(prefix="lino-metadata-") as temporary:
    repo = Path(temporary)

    def git(*args):
        return subprocess.check_output(["git", *args], cwd=repo, text=True).strip()

    git("init", "-q", "-b", "main")
    git("config", "user.name", "Test")
    git("config", "user.email", "test@example.com")
    (repo / "js").mkdir()
    manifest = repo / "js/package.json"
    manifest.write_text('{"name":"fixture","version":"1.0.0","dependencies":{"example":"1"}}\n')
    git("add", ".")
    git("commit", "-qm", "validated")
    base = git("rev-parse", "HEAD")

    def validate(expected):
        output = subprocess.run(["python3", str(ROOT / "scripts/check-release-metadata.py"), base, "--", "--cached"], cwd=repo,
                                text=True, capture_output=True, env={**os.environ, "GITHUB_SHA": ""})
        print((output.stdout + output.stderr).replace("::", ": :"))
        assert (output.returncode == 0) == expected

    manifest.write_text('{"name":"fixture","version":"1.0.1","dependencies":{"example":"1"}}\n')
    git("add", ".")
    validate(True)
    manifest.write_text('{"name":"fixture","version":"1.0.1","dependencies":{"example":"2"}}\n')
    git("add", ".")
    validate(False)
    git("reset", "--hard", base)
    (repo / "js/source.js").write_text("Untested source\n")
    git("add", ".")
    validate(False)
print("Metadata-only synchronization and failed/cancelled/unknown terminal statuses verified.")
