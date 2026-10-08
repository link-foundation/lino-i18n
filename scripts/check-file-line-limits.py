#!/usr/bin/env python3
"""Check all tracked implementation files, excluding generated data and locks."""
from pathlib import Path
import subprocess

files = subprocess.check_output(["git", "ls-files", "-z", "--", "js", "rust", "scripts", ".github", ".githooks"], text=True).split("\0")
failed = False
for name in files:
    path = Path(name)
    if path.suffix not in {".js", ".mjs", ".cjs", ".ts", ".rs", ".sh", ".py", ".yml", ".yaml"} or not path.is_file():
        continue
    count = len(path.read_text().splitlines())
    if count > 1500:
        print(f"::error file={name}::{count} lines exceeds 1500")
        failed = True
    elif count > 1350:
        print(f"::warning file={name}::{count} lines approaches 1500")
raise SystemExit(int(failed))
