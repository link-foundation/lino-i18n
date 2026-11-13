#!/usr/bin/env python3
"""Collect complete registry-backed dependency evidence without installing packages.

Run before and after updates. Network concurrency is limited to four requests;
only selected metadata is saved. Historical evidence folders are not manifests.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import tomllib
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/log/issues/43/pulls/44/registry'


def fetch(url):
    with urlopen(Request(url, headers={'User-Agent': 'lino-i18n-issue-43 (dependency freshness audit)'})) as response:
        return json.load(response)


def inventory():
    package = json.loads((ROOT / 'js/package.json').read_text())
    lock = json.loads((ROOT / 'js/package-lock.json').read_text())
    npm = {}
    for path, item in lock['packages'].items():
        if not path or item.get('link'):
            continue
        name = item.get('name', path.rsplit('node_modules/', 1)[-1])
        npm.setdefault(name, {'versions': [], 'locations': []})
        if item['version'] not in npm[name]['versions']:
            npm[name]['versions'].append(item['version'])
        npm[name]['locations'].append(path)
    cargo = {}
    for item in tomllib.loads((ROOT / 'rust/Cargo.lock').read_text())['package']:
        if 'source' in item:
            cargo.setdefault(item['name'], {'versions': [], 'requirements': []})['versions'].append(item['version'])
    for path in [*sorted((ROOT / 'rust').glob('**/Cargo.toml')), *sorted((ROOT / 'rust/scripts').glob('*.rs'))]:
        if 'target' in path.parts:
            continue
        if path.suffix == '.rs':
            block = re.search(r'//! ```cargo\n(.*?)//! ```', path.read_text(), re.S)
            if not block:
                continue
            doc = tomllib.loads(re.sub(r'^//! ?', '', block[1], flags=re.M))
        else:
            doc = tomllib.loads(path.read_text())
        for section in ('dependencies', 'dev-dependencies', 'build-dependencies'):
            for name, requirement in doc.get(section, {}).items():
                if isinstance(requirement, dict) and 'path' in requirement:
                    continue
                cargo.setdefault(name, {'versions': [], 'requirements': []})['requirements'].append(
                    {'path': str(path.relative_to(ROOT)), 'version': requirement if isinstance(requirement, str) else requirement.get('version')})
    actions, tools = {}, {}
    for path in sorted((ROOT / '.github').rglob('*.yml')):
        for name, ref in re.findall(r'uses: ([^@\s]+)@(\S+)', path.read_text()):
            actions.setdefault(name, set()).add(ref)
        for name, pattern in {
            'rust-script': r'cargo install rust-script --version (\S+)',
            'cargo-audit': r'cargo-audit@(\S+)',
            'zizmor': r'zizmor==(\S+)',
            'node': r'(?:node-version:|NODE_VERSION:) ([^$\s]\S*)',
            'bun': r'bun-version: (\S+)',
            'deno': r'deno-version: (\S+)',
            'python': r'python-version: [\'\"]?([\d.]+)',
        }.items():
            tools.setdefault(name, set()).update(re.findall(pattern, path.read_text()))
    return {'npm': npm, 'cargo': cargo,
            'manifest': {key: package.get(key, {}) for key in ['dependencies', 'devDependencies', 'peerDependencies', 'engines', 'allowScripts']},
            'actions': {k: sorted(v) for k, v in actions.items()}, 'tools': {k: sorted(v) for k, v in tools.items()}}


def collect(kind, name):
    if kind == 'npm':
        url = 'https://registry.npmjs.org/' + quote(name, safe='@/') + '/latest'
        data = fetch(url)
        return kind, name, {'url': url, **{k: data[k] for k in ['version', 'engines', 'peerDependencies', 'dependencies', 'deprecated', 'repository'] if k in data}}
    url = 'https://crates.io/api/v1/crates/' + name
    data = fetch(url)
    stable = [v for v in data['versions'] if not v['yanked'] and '-' not in v['num'].split('+')[0]]
    latest = max(stable, key=lambda v: tuple(map(int, v['num'].split('+')[0].split('.'))))
    return kind, name, {'url': url, 'version': latest['num'], 'rust_version': latest.get('rust_version'),
                        'repository': data['crate'].get('repository'), 'created_at': latest['created_at']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('phase', choices=['before', 'after'])
    parser.add_argument('--refresh', action='store_true')
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    current = inventory()
    (OUT / f'{args.phase}-inventory.json').write_text(json.dumps(current, indent=2) + '\n')
    registry_path = OUT / 'latest.json'
    registry = json.loads(registry_path.read_text()) if registry_path.exists() and not args.refresh else {'npm': {}, 'cargo': {}}
    before_path = OUT / 'before-inventory.json'
    before = json.loads(before_path.read_text()) if before_path.exists() else current
    jobs = [(kind, name) for kind in ['npm', 'cargo']
            for name in sorted(current[kind].keys() | before[kind].keys())
            if name not in registry[kind]]
    bundle_path = OUT / 'npm-tool-bundle.json'
    if bundle_path.exists():
        bundles = json.loads(bundle_path.read_text())['cases']
        tool_names = set().union(*(case['packages'] for case in bundles.values()))
        scheduled = {name for kind, name in jobs if kind == 'npm'}
        jobs += [('npm', name) for name in tool_names if name not in registry['npm'] and name not in scheduled]
    jobs += [('cargo', name) for name in ['rust-script', 'cargo-audit', 'cargo-edit'] if name not in registry['cargo'] and name not in current['cargo']]
    jobs += [('npm', name) for name in ['npm', 'npm-check-updates'] if name not in registry['npm'] and name not in current['npm']]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for kind, name, data in pool.map(lambda job: collect(*job), jobs):
            registry[kind][name] = data
    registry['queried_at'] = datetime.now(timezone.utc).isoformat()
    registry_path.write_text(json.dumps(registry, indent=2) + '\n')
    print(f"Recorded {len(current['npm'])} npm packages, {len(current['cargo'])} crates, {len(current['actions'])} actions/images.")
    for section in ['dependencies', 'devDependencies']:
        for alias, requirement in current['manifest'][section].items():
            name = requirement[4:].rsplit('@', 1)[0] if requirement.startswith('npm:') else alias
            latest = registry['npm'][name]['version']
            print(f'{section:16} {alias:45} {requirement:20} {latest}')
    for name, data in sorted(current['cargo'].items()):
        if data['requirements']:
            print('cargo', name, sorted({r['version'] for r in data['requirements']}), 'latest', registry['cargo'][name]['version'])


if __name__ == '__main__':
    main()
