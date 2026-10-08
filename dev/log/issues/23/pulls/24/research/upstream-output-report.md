The current template returns exit code 0 when a required Actions output cannot be written. A downstream job can then interpret the missing `version` or `release_needed` output as an intentional skip and report a successful pipeline.

Reproduced against main commit `cece347b3cd3a0b715583d7294e1fd93ad2d4c56`, using `scripts/get-version.rs`. The same warning-only pattern appears in other release helpers.

Reproduction (requires rust-script):

```bash
git clone https://github.com/link-foundation/rust-ai-driven-development-pipeline-template template
git -C template checkout cece347b3cd3a0b715583d7294e1fd93ad2d4c56
script="$PWD/template/scripts/get-version.rs"
fixture=$(mktemp -d)
cd "$fixture"
printf '[package]\nname="fixture"\nversion="1.0.0"\n' > Cargo.toml
GITHUB_OUTPUT="$fixture" rust-script "$script"
echo "exit=$?"
```

Actual result:

```text
Current version: 1.0.0
Output: version=1.0.0
Warning: Could not write to GITHUB_OUTPUT: Is a directory (os error 21)
exit=0
```

Expected: a nonzero exit status when GITHUB_OUTPUT is configured but cannot be opened or written. An unset GITHUB_OUTPUT should continue to support local use.

Workaround: after running a release helper, require the expected output key to exist in GITHUB_OUTPUT before evaluating downstream release conditions. Do not replace an invalid configured output path with `/dev/null`.

Suggested code fix: centralize output writes in one helper, return `std::io::Result<()>`, propagate both open and write errors to `main`, and exit unsuccessfully with contextual diagnostics. Apply it to every producer, rather than only get-version. Add a regression test with GITHUB_OUTPUT set to a temporary directory and assert a nonzero exit code; also test successful output and the unset local case.

Found while investigating link-foundation/lino-i18n#23 and fixed across its release helpers in https://github.com/link-foundation/lino-i18n/pull/24. Its reproducible experiment is `experiments/issue-23-template-output.py`; the archived template source and reproduction log are in `dev/log/issues/23/pulls/24`.
