#!/usr/bin/env python3
"""Keep one version per dependency across CI and tie test legs to declared floors."""
import json
from pathlib import Path
import re
import sys
import tomllib
import yaml

TOOL_PINS = {
    "rust-script": r"cargo install rust-script --version (\S+)",
    "zizmor": r"zizmor==(\S+)",
    "cargo-audit": r"cargo-audit@(\S+)",
    "node-version": r"node-version: ([^$\s]\S*)",
    "bun-version": r"bun-version: (\S+)",
    "deno-version": r"deno-version: (\S+)",
}


def check(root):
    root = Path(root)
    files = sorted((root / ".github").rglob("*.yml"))
    errors = []
    pins = {}
    for path in files:
        text = path.read_text()
        for action, ref in re.findall(r"uses: ([^@\s]+)@(\S+)", text):
            pins.setdefault(action, {}).setdefault(ref, set()).add(path.name)
        for tool, pattern in TOOL_PINS.items():
            for version in re.findall(pattern, text):
                pins.setdefault(tool, {}).setdefault(version, set()).add(path.name)
    for name, refs in sorted(pins.items()):
        if len(refs) > 1:
            errors.append(f"{name} is pinned at {len(refs)} versions: {sorted(refs)}")

    rust = tomllib.loads((root / "rust/Cargo.toml").read_text())["workspace"]["package"]["rust-version"]
    workflow = yaml.safe_load((root / ".github/workflows/rust.yml").read_text())
    toolchains = {str(leg.get("toolchain")) for leg in workflow["jobs"]["test"]["strategy"]["matrix"].get("include", [])}
    if rust not in toolchains:
        errors.append(f"rust.yml tests no MSRV leg for rust-version {rust} (has {sorted(toolchains)})")

    engines = json.loads((root / "js/package.json").read_text())["engines"]["node"]
    floor = re.fullmatch(r">=\s*(\d+)(?:\.\d+){0,2}", engines)
    matrix = yaml.safe_load((root / ".github/workflows/js.yml").read_text())["jobs"]["test"]["strategy"]["matrix"]
    nodes = {str(node) for node in matrix.get("node", [])} | {str(leg.get("node")) for leg in matrix.get("include", [])}
    if not floor:
        errors.append(f"js/package.json engines.node must be a single >= floor, got {engines!r}")
    elif not any(node.split(".")[0] == floor[1] for node in nodes):
        errors.append(f"js.yml tests no Node {floor[1]} leg for engines {engines!r} (has {sorted(nodes)})")
    return errors


if __name__ == "__main__":
    problems = check(sys.argv[1] if len(sys.argv) > 1 else ".")
    for problem in problems:
        print(f"::error::{problem}")
    if problems:
        sys.exit(1)
    print("Every action and tool has one version; MSRV and Node floor legs are tested.")
