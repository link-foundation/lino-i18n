"""Collect a pinned upstream capability inventory without running upstream code."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDY = ROOT / 'docs/case-studies/issue-25'
DATA = STUDY / 'data'
COMMIT = 'fb7584f5548b7454a7c95827de459c684f659d5b'
TEMPLATE_COMMIT = '1baa3ebb81a09dbe9cdb52244c169404d4377911'


def command(*args):
    return subprocess.check_output(args, cwd=ROOT)


def preserve_template():
    paths = command('git', 'ls-tree', '-r', '--name-only', TEMPLATE_COMMIT, '--',
                    'docs/case-studies/issue-25').decode().splitlines()
    for name in paths:
        original = ROOT / name
        relative = original.relative_to(STUDY)
        saved = STUDY / 'template-background' / relative
        saved.parent.mkdir(parents=True, exist_ok=True)
        content = command('git', 'show', f'{TEMPLATE_COMMIT}:{name}')
        saved.write_bytes(content)
        if original.exists() and original.read_bytes() == content:
            original.unlink()


def collect():
    preserve_template()
    DATA.mkdir(parents=True, exist_ok=True)
    readme = DATA / 'README.md'
    if readme.exists() and readme.read_text().startswith('<div align="center">'):
        readme.rename(DATA / 'gt-README.txt')
    old_readme = DATA / 'gt-README.md'
    if old_readme.exists():
        old_readme.rename(DATA / 'gt-README.txt')
    license_file = DATA / 'gt-LICENSE.md'
    if license_file.exists():
        license_file.rename(DATA / 'gt-LICENSE.txt')
    tree = json.loads(command('gh', 'api',
                              f'repos/generaltranslation/gt/git/trees/{COMMIT}?recursive=1'))
    packages = [item['path'] for item in tree['tree']
                if item['path'].startswith('packages/') and item['path'].endswith('/package.json')
                and item['path'].count('/') == 2]
    extra = [
        'packages/react-core/src/components/derivation/Derive.tsx',
        'packages/core/src/derive/derive.ts',
        'packages/core/src/derive/declareVar.ts',
        'packages/format/src/LocaleConfig.ts',
        'packages/format/src/types.ts',
        'packages/format/src/locales/customLocaleMapping.ts',
        'packages/format/src/locales/isSupersetLocale.ts',
    ]
    existing = [path.name.replace('--', '/') for path in DATA.glob('packages--*')]
    files = []
    for source in sorted(set(packages + extra + existing)):
        target = DATA / source.replace('/', '--')
        if not target.exists():
            content = command('gh', 'api', f'repos/generaltranslation/gt/contents/{source}?ref={COMMIT}',
                              '-H', 'Accept: application/vnd.github.raw+json')
            target.write_bytes(content)
        files.append({'path': source, 'file': target.name,
                      'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
    (DATA / 'snapshot.json').write_text(json.dumps({
        'repository': 'https://github.com/generaltranslation/gt', 'commit': COMMIT,
        'observed': '2026-10-08', 'license': 'MIT (see gt-LICENSE.txt)',
        'files': files,
    }, indent=2) + '\n')


if __name__ == '__main__':
    collect()
