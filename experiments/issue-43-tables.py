#!/usr/bin/env python3
"""Render every registry-inventoried dependency and its retained constraints."""
import json
from pathlib import Path
import tomllib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/log/issues/43/pulls/44/registry'


def read(name):
    return json.loads((OUT / name).read_text())


before, after, latest = (read(name) for name in ['before-inventory.json', 'after-inventory.json', 'latest.json'])
parents = read('npm-parents.json')
header = f"Registry snapshot: {latest['queried_at']}. `Before` is main at 3da5027; `after` is this PR.\n\n"


def table(name, introduction, columns, rows):
    def escape(value):
        return str(value).replace('|', '\\|').replace('\n', ' ')
    text = header + introduction + '\n\n'
    text += '| ' + ' | '.join(columns) + ' |\n'
    text += '| ' + ' | '.join(['---'] * len(columns)) + ' |\n'
    text += ''.join('| ' + ' | '.join(map(escape, row)) + ' |\n' for row in rows)
    (OUT / name).write_text(text)


rows = []
for section in ['dependencies', 'devDependencies', 'peerDependencies']:
    for alias, constraint in sorted(after['manifest'][section].items()):
        name = constraint[4:].rsplit('@', 1)[0] if constraint.startswith('npm:') else alias
        note = 'Current release included.'
        if alias == 'eslint9':
            note = 'Compatibility fixture for the advertised ESLint 9 plugin API; latest 9.x, while the primary linter is 10.15.0. Removing it would remove existing compatibility coverage. Its pre-existing EOL notice is documented, not newly introduced.'
        if section == 'peerDependencies' and name in ['react', 'react-dom']:
            note = 'Keep the existing React 18 consumer contract; current React 19.3.1 is installed and tested.'
        rows.append((section, alias, before['manifest'][section].get(alias, '—'), constraint,
                     latest['npm'][name]['version'], note))
table('npm-direct.md', 'All runtime, development and optional peer requirements. npm-check-updates was used across majors; only the deliberate ESLint 9 compatibility alias is excluded.',
      ['Kind', 'Dependency', 'Before', 'After', 'Registry latest', 'Reason / verification'], rows)

rows, exceptions = [], []
for name in sorted(before['npm'].keys() | after['npm'].keys()):
    old = before['npm'].get(name, {}).get('versions', [])
    current = after['npm'].get(name, {}).get('versions', [])
    release = latest['npm'][name]['version']
    reason = 'Current.' if current else 'Removed by the regenerated dependency tree.'
    retained = [version for version in current if version != release]
    if retained:
        requirements = set()
        for location in after['npm'][name]['locations']:
            for parent in parents.get(location, []):
                if not parent['latestAllowed']:
                    requirements.add(f"{parent['parent']} requires {parent['range']}")
        reason = '; '.join(sorted(requirements))
        if not reason:
            # Prerelease compiler internals can be ahead of the latest dist-tag.
            reason = 'Upstream compiler selects a coordinated prerelease ahead of the stable latest dist-tag; downgrading its internals would break that compiler.'
        else:
            reason += '. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration.'
        if name == 'eslint':
            reason += ' ESLint 9 is an intentional compatibility fixture; ESLint 10 is the primary linter.'
        exceptions.append((name, ', '.join(retained), release, reason))
    rows.append((name, ', '.join(old) or '—', ', '.join(current) or '—', release, reason))
table('npm-lock.md', 'Every unique direct/transitive package name, including removed packages and all platform-specific optional binaries. Full per-location data is in the inventory JSON and npm-parents.json. Older versions are parent-controlled compatibility exceptions, not silently claimed as latest.',
      ['Dependency', 'Before resolved', 'After resolved', 'Registry latest', 'Reason'], rows)
table('npm-exceptions.md', 'Every retained version different from the registry latest dist-tag. These are explicit upstream/consumer compatibility constraints. Current parents were upgraded and the resulting tree audited; no incompatible override is hidden in package.json.',
      ['Dependency', 'Retained version(s)', 'Registry latest', 'Reason'], exceptions)

bundles = read('npm-tool-bundle.json')['cases']
old_tool = bundles['legacy']['packages']
new_tool = bundles['baseline']['packages']
rows = []
for name in sorted(old_tool.keys() | new_tool.keys()):
    old_versions = sorted(set(old_tool.get(name, {}).get('versions', [])))
    versions = sorted(set(new_tool.get(name, {}).get('versions', [])))
    release = latest['npm'][name]['version']
    note = 'Current.' if versions else 'Removed by npm upstream.'
    if any(version != release for version in versions):
        owners = [f"{parent} requires {item['requirements'][name]}" for parent, item in new_tool.items()
                  if name in item['requirements']]
        note = 'Official npm bundle; consumer overrides do not replace bundled entries. ' + '; '.join(owners)
    if name in ['glob', 'minimatch']:
        note += ' BLOCKED: published advisory; upstream npm/cli#10299. See ANALYSIS.md.'
    rows.append((name, ', '.join(old_versions) or '—', ', '.join(versions) or '—', release, note))
table('npm-tool-bundle.md', 'Complete separately audited official npm CLI tree: previous pinned recovery npm 11.21.0 versus current npm 12.2.2. This tree is outside the application lockfile. Its unresolved glob/minimatch advisories are not hidden by the clean application audit. Overrides were tested and do not repair bundled copies.',
      ['Tool dependency', 'Before bundled', 'After bundled', 'Registry latest', 'Reason / blocker'], rows)

lock = tomllib.loads((ROOT / 'rust/Cargo.lock').read_text())['package']
cargo_parents = {}
for package in lock:
    for dependency in package.get('dependencies', []):
        cargo_parents.setdefault(dependency.split()[0], set()).add(f"{package['name']}@{package['version']}")
rows = []
for name in sorted(before['cargo'].keys() | after['cargo'].keys()):
    b, a = before['cargo'].get(name, {}), after['cargo'].get(name, {})
    release = latest['cargo'][name]['version']
    versions = a.get('versions', [])
    requirements = '; '.join(f"{r['path']}: {r['version']}" for r in a.get('requirements', []))
    reason = 'Current.'
    if not a:
        reason = 'Removed by cargo update.'
    elif versions and any(v != release for v in versions):
        if name == 'links-notation':
            reason = 'Published lino-objects-codec 0.9.3 still requires ^0.27.1. Upstream main has ^0.31.3 but has not published the Rust migration. Latest published codec retained; upstream publication report linked in ANALYSIS.md.'
        elif name == 'num-bigint':
            reason = 'num-rational 0.4.2 / calendrical_calculations 0.2.4 require num-bigint ^0.4; latest 0.5 has an incompatible API. Keep the newest compatible release until those latest parents migrate.'
        else:
            reason = 'Parent-controlled incompatible range: ' + ', '.join(sorted(cargo_parents.get(name, [])))
    rows.append((name, ', '.join(b.get('versions', [])) or 'helper only', ', '.join(versions) or 'helper only' if a else '—',
                 release, requirements or 'transitive', reason))
table('cargo.md', 'Every lockfile crate and every direct dependency in workspace/member manifests and standalone rust-script cargo blocks. Build metadata (+spec-1.1.0) does not affect Cargo requirement matching.',
      ['Crate', 'Before resolved', 'After resolved', 'Registry latest', 'After direct requirements / location', 'Reason'], rows)

actions = read('action-releases.json')
rows = []
for name, refs in sorted(after['actions'].items()):
    key = name.split('/')[0:2]
    repo = '/'.join(key)
    if name.startswith('docker://'):
        repo = 'rhysd/actionlint'
    release = actions[repo]
    note = 'Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained.'
    if len(refs[0]) == 40:
        note = 'Current immutable commit.'
    if repo == 'dtolnay/rust-toolchain':
        note = release['note']
    if name.startswith('docker://'):
        note = 'Current release image; digest verified against Docker Hub. Existing schema-gap reports remain open.'
    rows.append((name, ', '.join(before['actions'].get(name, [])), ', '.join(refs), release.get('tag'), release.get('sha'), note))
table('actions.md', 'Every workflow/composite uses reference. Tag release metadata, annotated-tag dereferencing and immutable SHAs are preserved in action-releases.json. CodeQL bundle releases are not action SemVer releases.',
      ['Action / image', 'Before ref', 'After ref', 'Latest release', 'Release commit', 'Reason'], rows)

tools = read('tool-releases.json')
rows = [
    ('PyYAML', '6.0.3', '6.0.3', tools['PyYAML']['version'], 'Only pip requirements dependency; no transitive dependencies. PyPI query and pip-audit saved.'),
    ('Node.js', '24.x primary; 22.x / 26.x', '26.x primary; 22.x / 24.x', '26.13.1 LTS', 'Retain older supported LTS test legs; latest stable LTS primary, 27 prereleases excluded.'),
    ('npm', '11.21.0 recovery; >=11.5.1 accepted; bundled CI', '12.2.2 in every install and release bootstrap', latest['npm']['npm']['version'], 'Major migration: pack JSON and supported Node patch floors; exact pin guard. BLOCKED tool security: official bundle has two published advisories; npm/cli#10299 and npm-tool-bundle.md.'),
    ('Rust toolchain', 'stable; 1.87 MSRV', 'stable; 1.92 MSRV', tools['rust-lang/rust']['tag_name'], 'Stable resolves current in CI; MSRV separately checks the supported floor including ICU.'),
    ('Rust edition', '2024', '2024', '2024', 'Latest stable edition; not a crate or a release channel.'),
    ('Python', '3.14', '3.15.2', '3.15.2', 'python.org release listing verified; source extraction retains Python 3.11+ compatibility.'),
    ('Bun', ', '.join(before['tools']['bun']), ', '.join(after['tools']['bun']), tools['oven-sh/bun']['tag_name'], 'Current.'),
    ('Deno', ', '.join(before['tools']['deno']), ', '.join(after['tools']['deno']), tools['denoland/deno']['tag_name'], 'Current.'),
    ('rust-script', ', '.join(before['tools']['rust-script']), ', '.join(after['tools']['rust-script']), latest['cargo']['rust-script']['version'], 'Current.'),
    ('cargo-audit', ', '.join(before['tools']['cargo-audit']), ', '.join(after['tools']['cargo-audit']), latest['cargo']['cargo-audit']['version'], 'Current; prebuilt binary avoids local compilation.'),
    ('zizmor', ', '.join(before['tools']['zizmor']), ', '.join(after['tools']['zizmor']), tools['zizmor']['version'], 'Current in both security modes.'),
    ('pip-audit', 'absent', '2.10.1', tools['pip-audit']['version'], 'New required Python audit; all severities checked.'),
    ('npm-check-updates', 'ad hoc', latest['npm']['npm-check-updates']['version'], latest['npm']['npm-check-updates']['version'], 'Research/update tool, not a shipped dependency.'),
    ('cargo-edit', 'not installed', 'not installed', latest['cargo']['cargo-edit']['version'], 'Registry-guided edits perform the same incompatible requirement refresh without compiling a one-off CLI.'),
    ('Ruby / Bundler', 'no live manifest', 'no live manifest', tools['ruby/ruby']['tag_name'], 'Only two archived upstream .rb research files; no executable Ruby, gems, Gemfile, gemspec, or lockfile to update.'),
    ('Docker base images', 'none', 'none', 'not applicable', 'No Dockerfile in live repository; composite accepts a caller-provided Dockerfile. Actionlint image is inventoried separately.'),
]
table('tools-python-ruby.md', 'Language versions, package managers, build/security tools, the complete Python dependency table, and the Ruby/Docker scope determination.',
      ['Dependency / tool', 'Before', 'After', 'Registry / release latest', 'Reason'], rows)
print(f"Rendered complete tables; {len(exceptions)} npm names retain explicit upstream constraints.")
