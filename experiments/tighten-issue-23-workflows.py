#!/usr/bin/env python3
"""Pin toolchain inputs and retain readable, independent YAML steps."""
from pathlib import Path
import yaml
class Dumper(yaml.SafeDumper):
    def ignore_aliases(self,data): return True
Dumper.add_representer(str, lambda dumper,value: dumper.represent_scalar('tag:yaml.org,2002:str',value,style='|' if '\n' in value else None))
for path in Path('.github/workflows').glob('*.yml'):
    workflow=yaml.safe_load(path.read_text())
    for name,job in workflow['jobs'].items():
        for step in job['steps']:
            if step.get('uses','').startswith('dtolnay/rust-toolchain@'):
                step.setdefault('with',{})['toolchain']='stable'
    path.write_text(yaml.dump(workflow,Dumper=Dumper,sort_keys=False,width=120))
