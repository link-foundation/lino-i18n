#!/usr/bin/env python3
"""Reproduce the merged action-pin regression without modifying the worktree."""
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
source = subprocess.check_output(['git', 'show', '3da5027:experiments/issue-29-crates-auth.py'], cwd=root, text=True)
# Keep __file__ at the real fixture path so all exercised commands use this repo.
program = f'__file__ = {str(root / "experiments/issue-29-crates-auth.py")!r}\n' + source
result = subprocess.run([sys.executable, '-c', program], cwd=root, text=True, capture_output=True)
print(result.stdout, end='')
print(result.stderr, end='')
assert result.returncode == 1, 'The unmodified baseline must reproduce its failed SHA assertion'
assert result.stderr.count("(job='") == 6, result.stderr
assert '3268eb413133e2960fa4ae0e963ca76380c54cd9' in result.stderr
print('Confirmed the three baseline job failures caused by the duplicated action SHA.')
