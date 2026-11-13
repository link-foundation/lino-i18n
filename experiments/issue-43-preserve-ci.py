#!/usr/bin/env python3
"""Preserve downloaded CI logs as reproducible gzip files with exact checksums."""
import gzip
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'dev/log/issues/43/pulls/44/ci-logs'
for path in sorted(OUT.glob('*.log')):
    with path.open('rb') as source, path.with_suffix('.log.gz').open('wb') as target:
        with gzip.GzipFile(filename='', mode='wb', fileobj=target, mtime=0) as archive:
            while block := source.read(65536):
                archive.write(block)
    path.unlink()
rows = []
for path in sorted(OUT.glob('*.log.gz')):
    digest = hashlib.sha256()
    count = size = 0
    with gzip.open(path, 'rb') as source:
        for line in source:
            count += 1
            size += len(line)
            digest.update(line)
    rows.append(f'| [{path.name}]({path.name}) | {count} | {size} | `{digest.hexdigest()}` |\n')
(OUT / 'INDEX.md').write_text(
    '# Preserved CI logs\n\n'
    'Names identify workflow/run IDs; run metadata and head SHAs are in `../github/`. '
    'Line references in ANALYSIS.md refer to the uncompressed bytes. '
    'Read with `gzip -dc NAME.log.gz` and bounded line ranges. Checksums below are '
    'SHA-256 of uncompressed data; gzip headers have a fixed zero timestamp.\n\n'
    '| Downloaded log | Lines | Uncompressed bytes | SHA-256 |\n'
    '| --- | --- | --- | --- |\n' + ''.join(rows))
print(f'Preserved {len(rows)} logs.')
