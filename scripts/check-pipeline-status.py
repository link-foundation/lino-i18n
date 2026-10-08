#!/usr/bin/env python3
"""Report failed/cancelled dependencies even when downstream jobs were skipped."""
import json
import os
import subprocess


def check(needs, *, cancellable=(), superseded=False):
    if not needs:
        raise ValueError("No pipeline dependencies were supplied")
    failures = {
        job: state.get("result") for job, state in needs.items()
        if state.get("result") not in {"success", "skipped"}
        and not (state.get("result") == "cancelled" and superseded and job in cancellable)
    }
    if failures:
        raise ValueError(f"Pipeline dependencies did not pass: {failures}")


def is_superseded():
    """Unresolved refs never excuse a cancellation; use the actual PR head SHA."""
    run = os.environ.get("RUN_SHA")
    branch = os.environ.get("BRANCH_NAME")
    if not run or not branch:
        return False
    try:
        head = subprocess.check_output(
            ["git", "ls-remote", "origin", f"refs/heads/{branch}"], text=True
        ).split()[0]
    except (subprocess.CalledProcessError, IndexError):
        return False
    if os.environ.get("PIPELINE_STATUS_VERBOSE") == "1":
        print(f"Pipeline run {run}; branch {branch} is at {head}")
    return head != run


if __name__ == "__main__":
    try:
        needs = json.loads(os.environ["NEEDS_JSON"])
        cancelled = any(state.get("result") == "cancelled" for state in needs.values())
        check(needs, cancellable=json.loads(os.environ.get("CANCELLABLE_JOBS", "[]")),
              superseded=cancelled and is_superseded())
    except (ValueError, KeyError) as error:
        raise SystemExit(f"::error::{error}")
    print("Every dependency passed, was skipped, or was superseded under its cancellation policy.")
