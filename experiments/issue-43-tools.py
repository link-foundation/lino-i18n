#!/usr/bin/env python3
"""Record release metadata for every live action and development tool."""
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/log/issues/43/pulls/44/registry'


def get(url):
    with urlopen(Request(url, headers={'User-Agent': 'lino-i18n issue 43'})) as response:
        return json.load(response)


def gh(path, paginate=False):
    command = ['gh', 'api', path]
    if paginate:
        command += ['--paginate', '--slurp']
    result = subprocess.run(command, text=True, capture_output=True)
    if result.returncode:
        raise ValueError(result.stderr)
    data = json.loads(result.stdout)
    return [item for page in data for item in page] if paginate else data


inventory = json.loads((OUT / 'before-inventory.json').read_text())
releases = {}
for action, pins in inventory['actions'].items():
    repo = 'rhysd/actionlint' if action.startswith('docker://') else '/'.join(action.split('/')[:2])
    if repo in releases:
        continue
    if repo == 'dtolnay/rust-toolchain':
        tag = gh(f'repos/{repo}/git/ref/tags/v1')
        latest = gh(f'repos/{repo}/commits/master')
        releases[repo] = {'url': f'https://github.com/{repo}', 'tag': 'v1', 'sha': tag['object']['sha'], 'latest_commit': latest['sha'],
                          'note': 'No versioned releases; v1 is the maintained immutable action entrypoint; toolchain selected separately.'}
    else:
        if repo == 'github/codeql-action':
            data = next(release for release in gh(f'repos/{repo}/releases?per_page=100', paginate=True)
                        if re.fullmatch(r'v\d+\.\d+\.\d+', release['tag_name']) and not release['prerelease'])
        else:
            data = gh(f'repos/{repo}/releases/latest')
        ref = gh(f'repos/{repo}/git/ref/tags/{data["tag_name"]}')
        sha = ref['object']['sha']
        if ref['object']['type'] == 'tag':
            sha = gh(f'repos/{repo}/git/tags/{sha}')['object']['sha']
        releases[repo] = {'url': data['html_url'], 'tag': data['tag_name'], 'sha': sha, 'published_at': data['published_at'], 'body': data['body']}
    (OUT / 'action-releases.json').write_text(json.dumps(releases, indent=2) + '\n')
    print(repo, releases[repo].get('tag'), releases[repo].get('sha'), flush=True)
tools = {}
for name in ['PyYAML', 'zizmor', 'pip-audit']:
    data = get(f'https://pypi.org/pypi/{name}/json')
    tools[name] = {'version': data['info']['version'], 'url': f'https://pypi.org/project/{name}/', 'requires_python': data['info']['requires_python']}
for repo in ['oven-sh/bun', 'denoland/deno', 'rust-lang/rust', 'ruby/ruby', 'astral-sh/uv']:
    data = gh(f'repos/{repo}/releases/latest')
    tools[repo] = {k: data[k] for k in ['tag_name', 'published_at', 'html_url', 'body']}
    tools[repo]['assets'] = [{'name': a['name'], 'url': a['browser_download_url']} for a in data['assets']]
tools['node'] = get('https://nodejs.org/dist/index.json')[:20]
tools['queried_at'] = datetime.now(timezone.utc).isoformat()
(OUT / 'tool-releases.json').write_text(json.dumps(tools, indent=2) + '\n')
print('Tool releases saved.')
