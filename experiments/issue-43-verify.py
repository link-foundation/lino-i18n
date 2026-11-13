#!/usr/bin/env python3
"""Run required suites sequentially with low-memory build settings and saved logs."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import resource
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/log/issues/43/pulls/44/verification'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('suite', choices=['rust', 'js', 'workflow'])
args = parser.parse_args()
env = {**os.environ, 'CARGO_BUILD_JOBS': '1', 'CARGO_PROFILE_DEV_DEBUG': '0', 'CARGO_PROFILE_TEST_DEBUG': '0',
       'RUSTFLAGS': '-Dwarnings', 'NODE_OPTIONS': '--max-old-space-size=1024'}
suites = {
    'rust': [
        ('rust-fmt', ['cargo', 'fmt', '--manifest-path', 'rust/Cargo.toml', '--all', '--', '--check'], ROOT),
        ('rust-clippy', ['cargo', 'clippy', '--locked', '--manifest-path', 'rust/Cargo.toml', '--all-targets', '--all-features', '--', '-D', 'warnings'], ROOT),
        ('rust-build', ['cargo', 'build', '--locked', '--manifest-path', 'rust/Cargo.toml', '--all-targets', '--all-features'], ROOT),
        ('rust-test', ['cargo', 'test', '--locked', '--manifest-path', 'rust/Cargo.toml', '--workspace', '--all-features'], ROOT),
        ('rust-doc', ['cargo', 'doc', '--locked', '--manifest-path', 'rust/Cargo.toml', '--workspace', '--all-features', '--no-deps'], ROOT),
    ],
    'js': [(name, ['npm', 'run', command], ROOT / 'js') for name, command in [
        ('node-test', 'test'), ('js-types', 'test:types'), ('js-lint', 'lint'), ('js-format', 'format:check'),
        ('js-duplication', 'check:duplication'), ('js-secrets', 'lint:secrets'), ('js-pack', 'pack:dry-run')]],
    'workflow': [(name, [sys.executable, script], ROOT) for name, script in [
        ('ci-policy', 'scripts/check-ci-policy.py'), ('pin-guard', 'scripts/check-dependency-pins.py'),
        ('pin-regression', 'experiments/issue-26-dependency-pins.py'), ('shared-guards', 'experiments/issue-23-shared-guards.py'),
        ('git-hook', 'experiments/issue-23-hook.py'), ('adapter-ci', 'experiments/issue-25-ci-regressions.py'),
        ('crates-auth', 'experiments/issue-29-crates-auth.py'), ('docs-check', 'scripts/check-docs.py'),
        ('file-lines', 'scripts/check-file-line-limits.py')]],
}
results = []
for name, command, cwd in suites[args.suite]:
    start = time.monotonic()
    with (OUT / f'{name}.log').open('w') as stream:
        process = subprocess.run(command, cwd=cwd, env=env, stdout=stream, stderr=subprocess.STDOUT)
    record = {'name': name, 'command': command, 'returncode': process.returncode, 'elapsed_seconds': round(time.monotonic() - start, 2),
              'peak_child_rss_kib': resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss, 'finished_at': datetime.now(timezone.utc).isoformat()}
    results.append(record)
    (OUT / f'{args.suite}-results.json').write_text(json.dumps(results, indent=2) + '\n')
    print(json.dumps(record), flush=True)
    # A killed compiler must not be retried by subsequent build/test commands.
    if process.returncode and args.suite == 'rust':
        break
raise SystemExit(any(record['returncode'] for record in results))
