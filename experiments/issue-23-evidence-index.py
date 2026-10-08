#!/usr/bin/env python3
"""Index complete pinned template trees and the local CI adaptation for review."""
import csv
import hashlib
import json
from pathlib import Path
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "dev/log/issues/23/pulls/24"


def mapping(language, path):
    name = Path(path).name
    if path.startswith(".github/workflows/"):
        if name in {"desktop-release.yml", "example-app.yml"}:
            return "product-specific workflow", "not applicable: no desktop binary or template example app"
        return "workflow", {
            "release.yml": f".github/workflows/{language}.yml: existing language release workflow preserved",
            "links.yml": ".github/workflows/docs.yml: product links and shared recheck tests",
        }.get(name, f".github/workflows/{name}")
    if path.startswith(".github/actions/"):
        return "container action", ".github/actions/publish-dockerhub/action.yml: preserve reusable action, add cache; no active Dockerfile"
    if path.startswith(".github/"):
        return "security configuration", ".github/codeql/codeql-config.yml and .github/zizmor.yml"
    if path.startswith("tests/"):
        if name in {"index.test.js", "sum.rs", "universal-app.test.js"} or path.startswith("tests/integration/"):
            return "template product test", "existing JS/Rust product tests retained; template demonstration product not imported"
        return "CI regression reference", "JS CI tests, Rust script unit tests, shared Node tests and experiments/issue-23-* fixtures"
    if path.startswith("scripts/"):
        local = ROOT / language / path
        shared = ROOT / "scripts" / name
        if local.exists():
            return "language CI helper", f"{language}/{path}: adapted to subdirectory/workspace layout"
        if shared.exists():
            return "shared CI helper", f"scripts/{name}: reused or adapted with regression tests"
        if any(term in name for term in ["desktop", "docker", "buildx"]):
            return "product-specific helper", "no desktop/container release contract; preserve reusable Docker action and native-platform input"
        targets = [
            (["version", "metadata", "push", "git-config", "release-index", "release-naming", "land-via"], "language version-and-commit helpers, scripts/check-release-metadata.py; metadata-only sync, classified retry, language tags"),
            (["publish", "registry", "sanitize", "package-info", "smoke-test"], "language publish/detection helpers, exact registry readers and existing package smoke-test workflow steps"),
            (["preflight"], "scripts/preflight-publish.sh and scripts/crates-publish-preflight.mjs"),
            (["pipeline", "status-gate", "cancel-in-progress"], "scripts/check-pipeline-status.py and scripts/check-ci-policy.py"),
            (["file", "required-docs", "cargo-lock", "cargo-warnings", "workflow-tools", "ci-workflow"], "scripts/check-file-line-limits.py, scripts/check-docs.py, workflow policy, locked Cargo and warnings-denied compilation"),
            (["install-git-hooks", "staged-formatting", "lint"], ".githooks/pre-commit, existing lint/format checks and documented opt-in installation"),
            (["debug", "github-actions-log", "run-with-budget"], "default-off DEBUG/PIPELINE_STATUS_VERBOSE diagnostics, contextual errors and finite job/request budgets"),
            (["bootstrap", "package-manager", "use-module", "install-rust-script"], "strict npm ci, direct locked local modules, verified npm recovery and pinned rust-script installation"),
        ]
        for terms, target in targets:
            if any(term in name for term in terms):
                return "adapted CI pattern", target
        return "adapted CI pattern", "existing language workflow/helpers and regression fixtures; no duplicate release framework imported"
    if path.startswith((".husky/", ".pre-commit")):
        return "local hook", ".githooks/pre-commit and README installation instructions"
    if path.startswith("docs/case-studies/"):
        return "historical template evidence", "inventory reviewed; not executable CI and not copied into product; relevant current regressions archived separately"
    if path.startswith("docs/"):
        return "template documentation", "README CI documentation and this investigation; template-specific documentation not product content"
    if path.startswith(("src/", "bin/", "examples/")):
        return "template product/example", "existing lino-i18n implementation and tests preserved; demonstration source not imported"
    if path.startswith((".changeset/", "changelog.d/")):
        return "release policy/data", "existing language release fragment policy; new patch fragments prepare the repository release"
    if name in {"package.json", "package-lock.json", "Cargo.toml", "Cargo.lock", "deno.json", "deno.lock", "bunfig.toml"}:
        return "manifest/runtime configuration", "existing js/ and rust/ manifests and locks; audited development tools and strict installation"
    if path.startswith(".") or name == "lychee.toml":
        return "tool/repository configuration", "existing formatter/linter configuration and new shared workflow/security/docs policy; no template branding copied"
    return "repository/product documentation", "inventory reviewed; existing library content and license preserved"


rows = []
manifest = []
for language in ["js", "rust"]:
    tree = json.loads((DEST / f"templates/{language}-tree.json").read_text())
    preserved = []
    archive_path = DEST / "templates" / f"{language}-source.tar.gz"
    archived_sources = {}
    if archive_path.exists():
        with tarfile.open(archive_path) as archive:
            for entry in archive.getmembers():
                if entry.isfile():
                    archived_sources[entry.name.partition("/")[2]] = archive.extractfile(entry).read()
    for item in tree["tree"]:
        if item["type"] != "blob":
            continue
        path = item["path"]
        category, target = mapping(language, path)
        archived = DEST / "templates" / language / path
        content = archived.read_bytes() if archived.exists() else archived_sources.get(path)
        rows.append([language, tree["sha"], path, item["sha"], category, target, content is not None])
        if content is not None:
            preserved.append({"path": path, "bytes": len(content),
                              "sha256": hashlib.sha256(content).hexdigest()})
    manifest.append({"language": language, "sha": tree["sha"], "preserved": preserved})
with (DEST / "templates/full-tree-comparison.csv").open("w", newline="") as stream:
    writer = csv.writer(stream)
    writer.writerow(["language", "template_commit", "path", "git_blob", "category", "local_application", "archived"])
    writer.writerows(rows)
(DEST / "templates/preserved-files.json").write_text(json.dumps(manifest, indent=2) + "\n")
paths = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=ROOT, text=True).splitlines()
ci_paths = sorted({p for p in paths if p.startswith((".github/", ".githooks/", "scripts/", "js/scripts/", "rust/scripts/", "experiments/"))})
(DEST / "github/current-ci-file-tree.txt").write_text("\n".join(ci_paths) + "\n")
print(f"Indexed {len(rows)} template files and {len(ci_paths)} local CI files")
