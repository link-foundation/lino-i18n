#!/usr/bin/env python3
"""Apply release synchronization and documentation layout corrections."""
from pathlib import Path
import yaml

class Dumper(yaml.SafeDumper):
    def ignore_aliases(self, data): return True

def string(dumper, value):
    return dumper.represent_scalar('tag:yaml.org,2002:str', value, style='|' if '\n' in value else None)
Dumper.add_representer(str,string)
for path in Path('.github/workflows').glob('*.yml'):
    workflow = yaml.safe_load(path.read_text())
    language = path.stem
    for name, job in workflow['jobs'].items():
        for step in job['steps']:
            if step.get('run') == 'cargo install rust-script --version 0.35.0 --locked':
                step['run'] = 'cargo install rust-script --version 0.36.0 --locked'
            if 'rust/README.md' in step.get('with',{}).get('args',''):
                step['with']['args'] = step['with']['args'].replace("'./rust/README.md'", "'./rust/lino-i18n/README.md'")
        if language in ('js','rust') and name in ('auto-release','manual-release'):
            if language == 'js':
                job['steps'] = [s for s in job['steps'] if s.get('name') != 'Merge multiple changesets']
                index = next(i for i,s in enumerate(job['steps']) if s.get('name') == 'Update npm for OIDC trusted publishing') + 1
                run = 'node scripts/version-and-commit.mjs --mode sync'
            else:
                index = next(i for i,s in enumerate(job['steps']) if s.get('name') == 'Install rust-script') + 1
                run = 'rust-script rust/scripts/version-and-commit.rs --sync-only'
            job['steps'].insert(index,{'name':'Synchronize only validated release metadata','run':run})
    path.write_text(yaml.dump(workflow,Dumper=Dumper,sort_keys=False,width=120))
