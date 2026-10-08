#!/usr/bin/env python3
"""Check terminal gate coverage and invariants shared by every workflow."""
import json
import re
from pathlib import Path
import yaml


def check(path):
    workflow = yaml.safe_load(path.read_text())
    jobs = workflow["jobs"]
    gate = jobs["pipeline-status"]
    assert set(gate["needs"]) == set(jobs) - {"pipeline-status"}, f"{path}: terminal gate omits a job"
    assert gate["if"] == "always()", f"{path}: terminal gate must report timeouts and cancellations"
    assert workflow["permissions"] == {"contents": "read"}, f"{path}: excessive default permissions"
    expected = {name for name, job in jobs.items() if name != "pipeline-status" and job["concurrency"]["cancel-in-progress"]}
    assert set(json.loads(gate["steps"][-1]["env"]["CANCELLABLE_JOBS"])) == expected, f"{path}: cancellation policy map is stale"
    for name, job in jobs.items():
        assert job.get("timeout-minutes"), f"{path}/{name}: missing timeout"
        concurrency = job["concurrency"]
        writer = bool(job.get("permissions", {}).get("contents") == "write" or job.get("permissions", {}).get("pages") == "write")
        if job.get("needs") and not writer:
            condition = job.get("if", "")
            assert re.search(r"\b(?:always|cancelled)\s*\(", condition), f"{path}/{name}: implicit success() skips checks after optional ancestors"
        assert concurrency["cancel-in-progress"] is not writer, f"{path}/{name}: cancellation policy disagrees with writer role"
        if writer:
            assert concurrency.get("queue") == "max", f"{path}/{name}: pending writers can be replaced; require queue: max"
        else:
            assert concurrency.get("queue", "single") == "single", f"{path}/{name}: cancellable checks cannot queue: max"
        for step in job["steps"]:
            if step.get("uses", "").startswith("actions/checkout@"):
                git_writer = job.get("permissions", {}).get("contents") == "write"
                assert step.get("with", {}).get("persist-credentials") is git_writer, f"{path}/{name}: checkout credentials disagree with Git writer role"
            assert "npm ci ||" not in step.get("run", ""), f"{path}/{name}: install fallback hides lock failures"
    print(f"{path}: all {len(jobs)} jobs covered")


if __name__ == "__main__":
    for path in Path(".github/workflows").glob("*.yml"):
        check(path)
