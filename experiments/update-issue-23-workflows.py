#!/usr/bin/env python3
"""Apply the reviewed shared CI invariants to the existing language workflows."""
from pathlib import Path
import yaml

writer_concurrency = {"group": "main-writer-${{ github.repository }}", "cancel-in-progress": False}

def checkout(writer=False, full=False):
    return {"uses": "actions/checkout@v6", "with": {"persist-credentials": writer, **({"fetch-depth": 0} if full else {})}}

def concurrency(name, workflow, job):
    if job.get("permissions", {}).get("contents") == "write":
        return writer_concurrency.copy()
    if job.get("permissions", {}).get("pages") == "write":
        return {"group": "pages-${{ github.repository }}", "cancel-in-progress": False}
    suffix = "-".join('${{ matrix.' + key + ' }}' for key in job.get('strategy', {}).get('matrix', {}) if key not in {'include','exclude'})
    return {"group": f"check-{workflow}-${{{{ github.ref }}}}-{name}-{suffix}", "cancel-in-progress": True}

for language in ('js', 'rust'):
    path=Path(f'.github/workflows/{language}.yml')
    workflow=yaml.safe_load(path.read_text())
    workflow['on']=workflow.pop(True)
    for event in ('push', 'pull_request'):
        workflow['on'][event]['paths'] = [f'{language}/**', 'docs/**', 'scripts/**', 'experiments/issue-23-*', 'README.md', '.github/**', '.githooks/**']
    workflow['on']['workflow_dispatch']['inputs']['bump_type']['default']='patch'
    workflow['permissions']={'contents':'read'}
    workflow.pop('concurrency',None)
    workflow['env'].pop('CARGO_REGISTRY_TOKEN',None)
    workflow['env'].pop('CARGO_TOKEN',None)
    workflow['env'].update({'GITHUB_BASE_SHA':'${{ github.event.pull_request.base.sha }}', 'GITHUB_HEAD_SHA':'${{ github.event.pull_request.head.sha }}', 'GITHUB_BEFORE_SHA':'${{ github.event.before }}'})
    jobs=workflow['jobs']
    for name,job in jobs.items():
        job['runs-on'] = job.get('runs-on','ubuntu-24.04').replace('ubuntu-latest','ubuntu-24.04')
        if 'strategy' in job:
            job['strategy']['matrix']['os']=['ubuntu-24.04','macos-15','windows-2025']
        writer=name in ('auto-release','manual-release','changeset-pr','changelog-pr')
        if writer:
            job['permissions']={'contents':'write', **({'id-token':'write'} if language=='js' and name in ('auto-release','manual-release') else {}), **({'pull-requests':'write'} if name.endswith('-pr') else {})}
        if name=='manual-release':
            job['needs']=['package']
            job['if']="always() && !cancelled() && needs.package.result == 'success' && github.ref == 'refs/heads/main' && github.event_name == 'workflow_dispatch' && inputs.release_mode == 'instant'"
        if name in ('changeset-pr','changelog-pr'):
            job['if'] += " && github.ref == 'refs/heads/main'"
        if language=='rust' and name in ('auto-release','manual-release'):
            job['env']={'CARGO_REGISTRY_TOKEN':'${{ secrets.CARGO_REGISTRY_TOKEN || secrets.CARGO_TOKEN }}'}
        if name=='deploy-docs':
            job['permissions']={'contents':'read','pages':'write','id-token':'write'}
        job['concurrency']=concurrency(name,language,job)
        changed_steps=[]
        for step in job['steps']:
            uses=step.get('uses','')
            if uses.startswith('actions/checkout@'):
                step=checkout(writer,True)
                if writer: step['with']['ref']='${{ github.ref_name }}'
            if 'run' in step:
                step['run']=step['run'].replace('npm ci || npm install','npm ci').replace('cargo install rust-script','cargo install rust-script --locked').replace('cargo build --manifest-path','cargo build --locked --manifest-path').replace('cargo test --manifest-path','cargo test --locked --manifest-path').replace('cargo clippy --manifest-path','cargo clippy --locked --manifest-path').replace('cargo run --manifest-path','cargo run --locked --manifest-path')
                if '${{ github.event.inputs.description }}' in step['run']:
                    step.setdefault('env',{})['RELEASE_DESCRIPTION']='${{ inputs.description }}'
                    step['env']['BUMP_TYPE']='${{ inputs.bump_type }}'
                    step['run']=step['run'].replace('${{ github.event.inputs.description }}','$RELEASE_DESCRIPTION').replace('${{ github.event.inputs.bump_type }}','$BUMP_TYPE')
                if '--should-pull' in step['run']: step['run']=step['run'].replace(' --should-pull','')
                if 'rust/scripts/*.rs' in step['run']:
                    step['run']='bash rust/scripts/check-scripts.sh'
            if uses.startswith('oven-sh/setup-bun@'):
                step['with']['bun-version']='1.4.2'
            if uses.startswith('denoland/setup-deno@'):
                step['with']['deno-version']='2.9.6'
            if step.get('run')=='bun install': step['run']='bun install --frozen-lockfile'
            # Every check/build sees the latest merge; metadata guards use the explicit PR head.
            if 'Simulate fresh merge' in step.get('name',''): continue
            changed_steps.append(step)
            if step.get('uses','').startswith('actions/checkout@') and name in ('lint','test','test-compilation','check-file-line-limits','browser-test','cli-smoke-test','package'):
                changed_steps.append({'name':'Validate the latest merge with the base branch','if':"github.event_name == 'pull_request'",'env':{'BASE_REF':'${{ github.base_ref }}'}, 'run': 'bash ../scripts/simulate-fresh-merge.sh' if language=='js' else 'bash scripts/simulate-fresh-merge.sh'})
        job['steps']=changed_steps
        if name in ('auto-release','manual-release'):
            version_index=next(i for i,s in enumerate(job['steps']) if s.get('name')=='Version and commit')
            preflight={'name':'Check publish credentials before versioning', 'run':'bash ../scripts/preflight-publish.sh npm' if language=='js' else 'bash scripts/preflight-publish.sh crates'}
            if name=='auto-release': preflight['if']="steps.check_release.outputs.should_release == 'true'" if language=='js' else "steps.check.outputs.should_release == 'true' && steps.check.outputs.crate_published != 'true'"
            if language=='rust': job['steps'].insert(version_index,{'uses':'actions/setup-node@v6','with':{'node-version':'24.x'}})
            job['steps'].insert(version_index,preflight)
    # Test, browser and CLI jobs fail fast after lint; optional guards can skip.
    if language=='rust':
        jobs['lint']['needs']=['detect-changes','version-check','changelog']
        jobs['test']['needs']=['detect-changes','lint']
        jobs['test']['if']="always() && !cancelled() && needs.lint.result == 'success'"
        jobs['lint']['steps'].append({'name':'Exercise release and CI script regressions','run':'python3 experiments/issue-23-rust-release.py && python3 experiments/issue-23-rust-guards.py'})
    else:
        jobs['lint']['needs']=['detect-changes','test-compilation','version-check','changeset-check','check-file-line-limits']
        jobs['test']['if']="always() && !cancelled() && needs.lint.result == 'success'"
    # Every Pages deployment contains both languages, preventing destructive overwrites.
    docs=jobs['deploy-docs']
    docs['defaults']={'run':{'working-directory':'.'}}
    docs['steps']=[checkout(True,True),{'uses':'actions/setup-node@v6','with':{'node-version':'24.x'}},{'uses':'dtolnay/rust-toolchain@stable'},{'name':'Install rust-script','run':'cargo install rust-script --locked'},{'uses':'actions/configure-pages@v6'},{'run':'node js/scripts/build-docs-site.mjs\ncargo doc --locked --manifest-path rust/Cargo.toml --workspace --no-deps\nrust-script rust/scripts/build-docs-site.rs\npython3 scripts/assemble-docs.py'},{'uses':'actions/upload-pages-artifact@v5','with':{'path':'site'}},{'id':'deployment','uses':'actions/deploy-pages@v5'}]
    names=list(jobs)
    jobs['pipeline-status']={'name':'Pipeline Status','runs-on':'ubuntu-24.04','timeout-minutes':5,'if':'always()','needs':names,'concurrency':{'group':f'check-{language}-${{{{ github.ref }}}}-status','cancel-in-progress':True},'steps':[checkout(),{'env':{'NEEDS_JSON':'${{ toJSON(needs) }}'},'run':'python3 scripts/check-pipeline-status.py'}]}
    path.write_text(yaml.safe_dump(workflow,sort_keys=False,width=1000))
