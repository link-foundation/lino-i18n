#!/usr/bin/env python3
"""Record the template adaptations used to build the repository quality gates."""
import json
from pathlib import Path
import subprocess
import yaml

ROOT = Path(__file__).resolve().parents[1]
PINS = {}
for action, ref in [('oven-sh/setup-bun','v2'), ('denoland/setup-deno','v2'), ('Swatinem/rust-cache','v2'), ('dtolnay/rust-toolchain','stable'), ('peter-evans/create-pull-request','v8')]:
    PINS[action] = json.loads(subprocess.check_output(['gh','api',f'repos/{action}/commits/{ref}']))['sha']
(ROOT/'dev/log/issues/23/pulls/24/research/action-pins.json').write_text(json.dumps(PINS,indent=2)+'\n')

CHECKOUT = {'uses':'actions/checkout@v6','with':{'persist-credentials':False}}
NODE = {'uses':'actions/setup-node@v6','with':{'node-version':'24.x'}}
RUST = {'uses':f'dtolnay/rust-toolchain@{PINS["dtolnay/rust-toolchain"]}'}
INIT_GIT = {'GIT_CONFIG_COUNT':'1','GIT_CONFIG_KEY_0':'init.defaultBranch','GIT_CONFIG_VALUE_0':'main'}

def job(name, steps, minutes=10):
    return {'name':name,'runs-on':'ubuntu-24.04','timeout-minutes':minutes,
            'concurrency':{'group':f'check-${{{{ github.workflow }}}}-${{{{ github.ref }}}}-{name}', 'cancel-in-progress':True},
            'steps':[CHECKOUT,*steps]}

def gate(workflow):
    jobs = workflow['jobs']
    jobs.pop('pipeline-status',None)
    terminal = job('Pipeline Status',[{'env':{'NEEDS_JSON':'${{ toJSON(needs) }}'},'run':'python3 scripts/check-pipeline-status.py'}],5)
    terminal.update({'if':'always()','needs':list(jobs)})
    jobs['pipeline-status'] = terminal

def write(path, workflow):
    gate(workflow)
    # Put the event key first and use literal multiline blocks for shell code.
    workflow = {'name':workflow['name'],'on':workflow.pop('on'),**{k:v for k,v in workflow.items() if k!='name'}}
    class Dumper(yaml.SafeDumper): pass
    def represent_string(dumper, value):
        return dumper.represent_scalar('tag:yaml.org,2002:str',value,style='|' if '\n' in value else None)
    Dumper.add_representer(str,represent_string)
    path.write_text(yaml.dump(workflow,Dumper=Dumper,sort_keys=False,width=120))

for language in ('js','rust'):
    path = ROOT/f'.github/workflows/{language}.yml'
    workflow = yaml.safe_load(path.read_text())
    workflow['env'].update(INIT_GIT)
    jobs = workflow['jobs']
    for name, item in jobs.items():
        if item.get('permissions',{}).get('contents') == 'write' or item.get('permissions',{}).get('pages') == 'write':
            item['concurrency']['group'] = 'main-writer-${{ github.repository }}-main'
        for step in item['steps']:
            uses = step.get('uses','')
            for action, sha in PINS.items():
                if uses.startswith(action+'@'): step['uses'] = f'{action}@{sha}'
            if uses.startswith('actions/checkout@'):
                step.get('with',{}).pop('ref',None)
                if name == 'deploy-docs': step['with']['persist-credentials'] = False
            if step.get('run') == 'cargo install rust-script --locked': step['run'] = 'cargo install rust-script --version 0.35.0 --locked'
        if language == 'js' and name == 'test':
            item['steps'].insert(2,NODE)
            for step in item['steps']:
                if step.get('run') == 'bun install --frozen-lockfile': step['run'] = 'npm ci'
                if step.get('run') == 'deno install': step['run'] = 'npm ci'
        if language == 'rust' and name in ('manual-release','auto-release'):
            setup = next(s for s in item['steps'] if s.get('uses','').startswith('actions/setup-node@'))
            item['steps'].remove(setup)
            item['steps'].insert(1,setup)
    jobs['lint']['if'] = "always() && !cancelled() && !contains(needs.*.result, 'failure') && !contains(needs.*.result, 'cancelled') && (" + jobs['lint']['if'].split('&& (',1)[1]
    preflight = job('Release credential preflight',[NODE,{'run':f'bash scripts/preflight-publish.sh {"npm" if language=="js" else "crates"}'}],5)
    preflight['if'] = "github.ref == 'refs/heads/main' && (github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && inputs.release_mode == 'instant'))"
    if language == 'js': preflight['permissions'] = {'contents':'read','id-token':'write'}
    else: preflight['env'] = {'CARGO_REGISTRY_TOKEN':'${{ secrets.CARGO_REGISTRY_TOKEN || secrets.CARGO_TOKEN }}'}
    jobs['release-preflight'] = preflight
    for name in ('auto-release','manual-release'):
        jobs[name]['needs'].append('release-preflight')
        jobs[name]['if'] = jobs[name]['if'].rstrip() + " && needs.release-preflight.result == 'success'"
    # Early check: no build can produce a release when required credentials are absent.
    jobs['detect-changes']['needs'] = ['release-preflight']
    jobs['detect-changes']['if'] = "always() && !cancelled() && !contains(needs.*.result, 'failure') && github.event_name != 'workflow_dispatch'"
    jobs['lint']['needs'].append('release-preflight')
    jobs['test-compilation' if language=='js' else 'lint']['needs'] = list(dict.fromkeys(jobs['test-compilation' if language=='js' else 'lint']['needs']))
    if language == 'js':
        jobs['lint']['steps'].append({'run':'npm audit --package-lock-only --audit-level=high'})
        jobs['lint']['steps'].append({'run':'node --test --test-timeout=30000 ../scripts/crates-publish-preflight.test.mjs && python3 ../experiments/issue-23-shared-guards.py'})
    write(path,workflow)

base = {'permissions':{'contents':'read'},'env':INIT_GIT}
workflow = {'name':'Workflows','on':{'push':{'branches':['main'],'paths':['.github/**','scripts/**','experiments/issue-23-*']},'pull_request':{'paths':['.github/**','scripts/**','experiments/issue-23-*']},'workflow_dispatch':None},**base,'jobs':{}}
workflow['jobs']['actionlint'] = job('actionlint',[{'uses':'docker://rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667','with':{'args':'-color'}}])
workflow['jobs']['policy'] = job('Workflow policy',[{'run':'python3 -m pip install --requirement scripts/requirements-ci.txt'},{'run':'python3 scripts/check-ci-policy.py && python3 scripts/check-file-line-limits.py && python3 experiments/issue-23-shared-guards.py'}])
workflow['jobs']['zizmor'] = job('zizmor',[{'run':'pipx run zizmor==1.30.1 --config .github/zizmor.yml --min-confidence medium .github/workflows .github/actions'},{'run':'pipx run zizmor==1.30.1 --config .github/zizmor.yml --persona pedantic --min-severity high --min-confidence high .github/workflows .github/actions'}])
write(ROOT/'.github/workflows/workflows.yml',workflow)
workflow = {'name':'Security','on':{'push':{'branches':['main']},'pull_request':None,'schedule':[{'cron':'0 6 * * 1'}],'workflow_dispatch':None},**base,'jobs':{}}
workflow['jobs']['npm-audit'] = job('npm audit',[NODE,{'run':'npm audit --package-lock-only --audit-level=high','working-directory':'js'}])
workflow['jobs']['cargo-audit'] = job('Cargo audit',[{'uses':'taiki-e/install-action@e67fa11c4b9316fa714ddf0abed07a0c3143b95b','with':{'tool':'cargo-audit@0.22.2'}},{'run':'cargo audit --file rust/Cargo.lock --deny warnings'}])
codeql = job('CodeQL',[{'uses':'github/codeql-action/init@v4','with':{'languages':'${{ matrix.language }}','build-mode':'none','config-file':'./.github/codeql/codeql-config.yml'}},{'uses':'github/codeql-action/analyze@v4'}],30)
codeql.update({'permissions':{'contents':'read','actions':'read','security-events':'write'},'strategy':{'fail-fast':False,'matrix':{'language':['javascript-typescript','rust','actions']}}})
codeql['concurrency']['group'] += '-${{ matrix.language }}'
workflow['jobs']['codeql'] = codeql
review = job('Dependency review',[{'uses':'actions/dependency-review-action@v5','with':{'fail-on-severity':'high'}}])
review['if'] = "github.event_name == 'pull_request'"
workflow['jobs']['dependency-review'] = review
write(ROOT/'.github/workflows/security.yml',workflow)
workflow = {'name':'Documentation','on':{'push':{'branches':['main'],'paths':['README.md','js/**','rust/**','docs/**','scripts/**','.github/workflows/docs.yml']},'pull_request':{'paths':['README.md','js/**','rust/**','docs/**','scripts/**','.github/workflows/docs.yml']},'workflow_dispatch':None},**base,'jobs':{}}
workflow['jobs']['validate-docs'] = job('Validate docs',[{'run':'python3 scripts/check-docs.py'},NODE,RUST,{'run':'cargo install rust-script --version 0.35.0 --locked'},{'run':'node js/scripts/build-docs-site.mjs\ncargo doc --locked --manifest-path rust/Cargo.toml --workspace --no-deps\nrust-script rust/scripts/build-docs-site.rs\npython3 scripts/assemble-docs.py'}],15)
workflow['jobs']['links'] = job('Product links',[{'uses':'lycheeverse/lychee-action@v2','with':{'args':"--verbose --no-progress --max-retries 3 --timeout 30 --exclude-path dev --exclude-path node_modules --exclude-path target --exclude-path experiments --exclude-path js/site --exclude-path rust/site --exclude-path site --exclude-path js/reports './README.md' './js/README.md' './rust/README.md' './docs/**/*.md'",'fail':True,'output':'lychee/out.md'},'env':{'GITHUB_TOKEN':'${{ github.token }}'}},{'uses':'actions/upload-artifact@v6','if':'always()','with':{'name':'product-links','path':'lychee/out.md','if-no-files-found':'error'}}])
write(ROOT/'.github/workflows/docs.yml',workflow)
