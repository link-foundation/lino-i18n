#!/usr/bin/env python3
"""Expose standalone rust-script helpers to CodeQL's Cargo semantic analyzer.

Generate an independent, nonpublishable Cargo package only in the analysis
checkout. Dependency declarations come from each helper's existing manifest;
conflicting or unsupported declarations fail instead of weakening analysis.
"""
import argparse
import json
from pathlib import Path
import re
import tomllib


def prepare(directory):
    directory = directory.resolve()
    dependencies = {}
    declarations = {}
    targets = []
    for script in sorted(directory.glob("*.rs")):
        source = script.read_text()
        if not re.search(r"^fn main\(", source, re.MULTILINE):
            continue
        targets.append(script)
        match = re.search(r"^//! ```cargo\n((?:^//!.*\n)*?)^//! ```", source, re.MULTILINE)
        if not match:
            continue
        manifest = "\n".join(line[3:].removeprefix(" ") for line in match[1].splitlines())
        parsed = tomllib.loads(manifest)
        if set(parsed) - {"dependencies"}:
            raise ValueError(f"Unsupported manifest sections in {script}")
        for name, specification in parsed.get("dependencies", {}).items():
            if name in dependencies and dependencies[name] != specification:
                raise ValueError(f"Conflicting {name} declarations in {script}")
            declaration = next((line for line in manifest.splitlines()
                                if re.match(rf"^{re.escape(name)}\s*=", line)), None)
            if declaration is None or tomllib.loads(declaration).get(name) != specification:
                raise ValueError(f"Unsupported multiline dependency {name} in {script}")
            dependencies[name] = specification
            declarations[name] = declaration
    if not targets:
        raise ValueError(f"No executable helpers in {directory}")
    content = ('[package]\nname = "lino-ci-scripts-analysis"\nversion = "0.0.0"\n'
               'edition = "2021"\npublish = false\n\n[workspace]\n\n[dependencies]\n')
    content += "\n".join(declarations[name] for name in sorted(declarations)) + "\n"
    for script in targets:
        content += f'\n[[bin]]\nname = {json.dumps(script.stem)}\npath = {json.dumps(script.name)}\n'
    assert tomllib.loads(content)["dependencies"] == dependencies
    with (directory / "Cargo.toml").open("x") as stream:
        stream.write(content)
    print(f"Prepared {len(targets)} Cargo targets for standalone helper analysis")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scripts-dir", type=Path,
                        default=Path(__file__).resolve().parents[1] / "rust/scripts")
    prepare(parser.parse_args().scripts_dir)
