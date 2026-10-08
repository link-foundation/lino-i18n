#!/usr/bin/env python3
"""Reject source drift before rebasing a validated release onto main.

Only version metadata, release notes, and consumed fragments may differ. Both
language pipelines share this validator so concurrent releases remain safe.
"""
import argparse
import copy
import json
import subprocess
import tomllib


def git(*args):
    return subprocess.check_output(["git", *args], text=True)


def without_versions(document, kind):
    result = copy.deepcopy(document)
    if kind == "json":
        result.pop("version", None)
        result.get("packages", {}).get("", {}).pop("version", None)
    elif kind == "manifest":
        result.get("package", {}).pop("version", None)
        result.get("workspace", {}).get("package", {}).pop("version", None)
        tables = [result, result.get("workspace", {})]
        tables.extend(result.get("target", {}).values())
        for table in tables:
            for section in ("dependencies", "dev-dependencies", "build-dependencies"):
                for dependency in table.get(section, {}).values():
                    if isinstance(dependency, dict) and "path" in dependency:
                        dependency.pop("version", None)
    else:
        for package in result.get("package", []):
            if "source" not in package:
                package.pop("version", None)
    return result


def validate(base, head):
    args = ["diff", "--name-status", "--no-renames", "-z"]
    args += ["--cached", base] if head == "--cached" else [base, head]
    fields = git(*args, "--").split("\0")
    for index in range(0, len(fields) - 1, 2):
        status, path = fields[index:index + 2]
        if path in ("js/CHANGELOG.md", "rust/CHANGELOG.md") and status in ("A", "M"):
            continue
        if status == "D" and path.endswith(".md") and not path.endswith("README.md") and path.startswith(("js/.changeset/", "rust/changelog.d/")):
            continue
        if status != "M":
            raise ValueError(f"Untested change {status} {path}; rerun CI on the new main commit")
        if path in ("js/package.json", "js/package-lock.json"):
            loader, kind = json.loads, "json"
        elif path.startswith("rust/") and path.endswith("Cargo.toml"):
            loader, kind = tomllib.loads, "manifest"
        elif path == "rust/Cargo.lock":
            loader, kind = tomllib.loads, "lock"
        else:
            raise ValueError(f"Untested source drift in {path}; rerun CI on the new main commit")
        old = without_versions(loader(git("show", f"{base}:{path}")), kind)
        new = without_versions(loader(git("show", f":{path}" if head == "--cached" else f"{head}:{path}")), kind)
        if old != new:
            raise ValueError(f"Non-version change in {path}; rerun CI on the new main commit")
        print(f"Allowed release metadata: {path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base")
    parser.add_argument("head")
    args = parser.parse_args()
    try:
        validate(args.base, args.head)
    except (ValueError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"Release validation failed: {error}\n")
