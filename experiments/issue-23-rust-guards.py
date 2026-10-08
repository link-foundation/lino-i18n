#!/usr/bin/env python3
"""Exercise actual Rust CI guards against bounded, isolated Git fixtures."""
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def run(*args, cwd):
    return subprocess.check_output(args, cwd=cwd, text=True).strip()


with tempfile.TemporaryDirectory(prefix="lino-rust-guards-") as temporary:
    repo = Path(temporary)
    run("git", "init", "-q", "-b", "main", cwd=repo)
    run("git", "config", "user.name", "Test", cwd=repo)
    run("git", "config", "user.email", "test@example.com", cwd=repo)

    def commit(path, text):
        target = repo / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text)
        run("git", "add", ".", cwd=repo)
        run("git", "commit", "-qm", path, cwd=repo)
        return run("git", "rev-parse", "HEAD", cwd=repo)

    commit("rust/Cargo.toml", '[workspace]\nmembers = ["member"]\n[workspace.package]\nversion = "1.0.0"\n')
    commit("rust/member/Cargo.toml", '[package]\nname = "member"\nversion = "1.0.0"\n')
    base = commit("rust/changelog.d/old.md", "---\nbump: patch\n---\nExisting fragment.\n")
    run("git", "update-ref", "refs/remotes/origin/main", base, cwd=repo)

    def guard(script, success, **overrides):
        environment = {**os.environ, "GITHUB_OUTPUT": "", "GITHUB_EVENT_NAME": "pull_request",
                       "GITHUB_BASE_SHA": base, "GITHUB_HEAD_SHA": "HEAD", "GITHUB_HEAD_REF": "changeset-release/spoof",
                       "GITHUB_BEFORE_SHA": "", "RUST_LOG": "error", **overrides}
        result = subprocess.run(["rust-script", str(ROOT / "rust/scripts" / script)], cwd=repo,
                                env=environment, text=True, capture_output=True)
        print(f"{script}: exit {result.returncode}\n{result.stdout}{result.stderr}")
        assert (result.returncode == 0) == success, f"Unexpected guard result: {script}"
        return result.stdout

    previous = base
    for path in (".githooks/pre-commit", "experiments/issue-23-hook.py"):
        head = commit(path, "Guard configuration.\n")
        assert "workflow-changed=true" in guard("detect-code-changes.rs", True,
                                                GITHUB_BASE_SHA=previous)
        previous = head

    run("git", "checkout", "-qb", "feature", cwd=repo)
    commit("rust/member/src/lib.rs", "pub fn example() {}\n")
    commit("docs/example.md", "Last commit changes only documentation.\n")
    assert "any-code-changed=true" in guard("detect-code-changes.rs", True)
    guard("check-changelog-fragment.rs", False)
    run("git", "mv", "rust/changelog.d/old.md", "rust/changelog.d/renamed.md", cwd=repo)
    run("git", "commit", "-qm", "Rename is not a new fragment", cwd=repo)
    guard("check-changelog-fragment.rs", False)
    commit("rust/changelog.d/new.md", "---\nbump: patch\n---\nNew release notes.\n")
    guard("check-changelog-fragment.rs", True)
    commit("rust/member/Cargo.toml", '[package]\nname="member"\nversion="1.0.0"\n')
    guard("check-version-modification.rs", True)
    commit("rust/member/Cargo.toml", '[package]\nname="member"\nversion="2.0.0"\n')
    guard("check-version-modification.rs", False)
    for script in ("detect-code-changes.rs", "check-changelog-fragment.rs", "check-version-modification.rs"):
        guard(script, False, GITHUB_BASE_SHA="missing-reference")
    run("git", "checkout", "-q", "main", cwd=repo)
    run("git", "merge", "--no-ff", "-qm", "Merge whole PR", "feature", cwd=repo)
    assert "any-code-changed=true" in guard("detect-code-changes.rs", True, GITHUB_EVENT_NAME="push")
    print("Whole-PR/merge, workspace member, formatting, spoofed branch, fragment rename and invalid-ref checks passed.")
