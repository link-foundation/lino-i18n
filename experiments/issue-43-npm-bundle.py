#!/usr/bin/env python3
"""Audit a finite npm CLI bundle, with and without consumer overrides.

Only lock metadata is installed. No lifecycle scripts or adversarial glob input
are executed. npm heap usage is bounded; temporary work is removed on exit.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/log/issues/43/pulls/44'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--npm', default='npm')
args = parser.parse_args()
env = {**os.environ, 'NODE_OPTIONS': '--max-old-space-size=512'}
version = subprocess.check_output([args.npm, '--version'], env=env, text=True).strip()
results = {'cli_version': version, 'queried_at': datetime.now(timezone.utc).isoformat(), 'cases': {}}
with tempfile.TemporaryDirectory(prefix='lino-issue43-npm-bundle-') as directory:
    work = Path(directory)
    for case in ['legacy', 'baseline', 'overrides']:
        manifest = {'private': True, 'dependencies': {'npm': '11.21.0' if case == 'legacy' else '12.2.2'}}
        if case == 'overrides':
            manifest['overrides'] = {'glob': '14.0.2', 'minimatch': '11.0.8'}
        (work / 'package.json').write_text(json.dumps(manifest))
        (work / 'package-lock.json').unlink(missing_ok=True)
        with (OUT / f'verification/npm-bundle-{case}-install.log').open('w') as stream:
            subprocess.run([args.npm, 'install', '--package-lock-only', '--ignore-scripts'],
                           cwd=work, env=env, stdout=stream, stderr=subprocess.STDOUT, check=True)
        lock_bytes = (work / 'package-lock.json').read_bytes()
        packages = json.loads(lock_bytes)['packages']
        audit = subprocess.run([args.npm, 'audit', '--package-lock-only', '--json', '--audit-level=low'],
                               cwd=work, env=env, capture_output=True, text=True)
        if audit.returncode not in [0, 1]:
            raise RuntimeError(audit.stderr or audit.stdout)
        data = json.loads(audit.stdout)
        if 'error' in data:
            raise RuntimeError(data['error'])
        (OUT / f'verification/npm-bundle-{case}-audit.json').write_text(json.dumps(data, indent=2) + '\n')
        inventory = {}
        for location, item in packages.items():
            if not location:
                continue
            name = item.get('name', location.rsplit('node_modules/', 1)[-1])
            inventory.setdefault(name, {'versions': [], 'locations': [], 'requirements': item.get('dependencies', {})})
            inventory[name]['versions'].append(item['version'])
            inventory[name]['locations'].append(location)
        results['cases'][case] = {
            'manifest': manifest, 'lock_sha256': hashlib.sha256(lock_bytes).hexdigest(),
            'glob': packages['node_modules/npm/node_modules/glob']['version'],
            'minimatch': packages['node_modules/npm/node_modules/minimatch']['version'],
            'audit_returncode': audit.returncode, 'audit_summary': data['metadata'], 'packages': inventory,
        }
(OUT / 'registry/npm-tool-bundle.json').write_text(json.dumps(results, indent=2) + '\n')
print(json.dumps({case: {key: value for key, value in result.items() if key != 'packages'}
                  for case, result in results['cases'].items()}, indent=2))
