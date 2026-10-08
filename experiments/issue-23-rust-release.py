#!/usr/bin/env python3
"""Run the actual Rust release main against local Git; stub only registry reads.

The fixture has a concurrent JS release commit, a Rust workspace dependency,
a lockfile, and a changelog fragment. No external repository can be pushed.
"""

import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def run(*args, cwd, **kwargs):
    return subprocess.run(args, cwd=cwd, check=True, text=True, capture_output=True, **kwargs)


with tempfile.TemporaryDirectory(prefix="lino-rust-release-") as temporary:
    base = Path(temporary)
    remote = base / "remote.git"
    repo = base / "repo"
    writer = base / "writer"
    run("git", "init", "--bare", "--initial-branch=main", str(remote), cwd=base)
    run("git", "clone", str(remote), str(repo), cwd=base)
    run("git", "config", "user.name", "Test", cwd=repo)
    run("git", "config", "user.email", "test@example.com", cwd=repo)
    files = {
        "rust/Cargo.toml": '[workspace]\nmembers = ["fixture", "macros"]\n[workspace.package]\nversion = "1.0.0"\n',
        "rust/fixture/Cargo.toml": '[package]\nname = "fixture"\nversion.workspace = true\n[dependencies]\nmacros = { path = "../macros", version = "1.0.0" }\n',
        "rust/macros/Cargo.toml": '[package]\nname = "macros"\nversion.workspace = true\n',
        "rust/Cargo.lock": 'version = 3\n\n[[package]]\nname = "fixture"\nversion = "1.0.0"\n\n[[package]]\nname = "macros"\nversion = "1.0.0"\n',
        "rust/CHANGELOG.md": '# Changelog\n\n## [1.0.0]\n\nInitial release\n',
        "rust/changelog.d/fix.md": '---\nbump: patch\n---\n\nRepair release automation.\n',
        "js/package.json": '{"version":"1.0.0"}\n',
    }
    for name, content in files.items():
        path = repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
    run("git", "add", ".", cwd=repo)
    run("git", "commit", "-m", "validated tree", cwd=repo)
    run("git", "push", "origin", "main", cwd=repo)
    run("git", "clone", str(remote), str(writer), cwd=base)
    run("git", "config", "user.name", "Test", cwd=writer)
    run("git", "config", "user.email", "test@example.com", cwd=writer)
    (writer / "js/package.json").write_text('{"version":"1.0.1"}\n')
    run("git", "commit", "-am", "concurrent JS release", cwd=writer)
    run("git", "push", "origin", "main", cwd=writer)

    scripts = base / "scripts"
    scripts.mkdir()
    for path in (ROOT / "rust/scripts").glob("*.rs"):
        shutil.copyfile(path, scripts / path.name)
    release = scripts / "version-and-commit.rs"
    source = release.read_text().replace('"scripts/check-release-metadata.py"', '"' + str(ROOT / 'scripts/check-release-metadata.py') + '"')
    source = source.replace('let max_published = get_max_published_version(&crate_name);',
                            'let max_published: Option<(u32, u32, u32)> = None;')
    source = source.replace('ensure_version_exceeds_published(&initial_bump, &crate_name, &tag_prefix, max_published)',
                            'initial_bump.clone()')
    release.write_text(source)
    result = subprocess.run(["rust-script", str(release), "--rust-root", "rust", "--tag-prefix", "rust-v", "--bump-type", "patch"],
                            cwd=repo, text=True, capture_output=True,
                            env={**os.environ, "RUSTFLAGS": "-A dead_code -A unused_variables", "GITHUB_OUTPUT": "", "GITHUB_SHA": "", "RUST_LOG": "error"})
    print(result.stdout, result.stderr)
    assert result.returncode == 0, "release must sync a clean checkout before generating metadata"
    assert not run("git", "status", "--porcelain", cwd=repo).stdout.strip()
    assert not (repo / "rust/changelog.d/fix.md").exists(), "released fragments must be consumed"
    assert '"1.0.1"' in (repo / "rust/Cargo.toml").read_text()
    assert '"1.0.1"' in (repo / "rust/fixture/Cargo.toml").read_text()
    assert (repo / "rust/Cargo.lock").read_text().count('"1.0.1"') == 2
    assert run("git", "rev-parse", "rust-v1.0.1^{}", cwd=repo).stdout == run("git", "rev-parse", "HEAD", cwd=repo).stdout
    assert run("git", "rev-parse", "HEAD", cwd=repo).stdout == run("git", "rev-parse", "main", cwd=remote).stdout
    print("Rust release synchronized, consumed fragments, committed metadata and pushed the correct tag.")
