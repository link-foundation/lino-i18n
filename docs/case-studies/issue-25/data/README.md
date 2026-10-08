# Evidence provenance

`issue.json` and `issue-comments.json` are authenticated GitHub CLI captures for
[issue 25](https://github.com/link-foundation/lino-i18n/issues/25). The comments
capture is empty. `recent-pulls.json`, `react-pr.json` and `browser-pr.json`
describe recent local changes, particularly PR 20 (React) and PR 22 (native
browser). `gt-recent-pulls.json` and `gt-attribute-localization.json` describe
recent upstream work and [GT PR 2382](https://github.com/generaltranslation/gt/pull/2382).

`packages--*` files are unmodified upstream manifests or source files pinned to
the commit in `snapshot.json`. Names replace `/` with `--` so they can be stored
in one evidence directory. `gt-README.txt` and `gt-LICENSE.txt` preserve upstream
context and the MIT notice. These files are research evidence, not local
package dependencies or code executed by tests.

Recollect the pinned files with `python3 experiments/collect-issue-25.py` from
the repository root. The script obtains the pinned tree through `gh api`,
preserves the template background from local commit
`1baa3ebb81a09dbe9cdb52244c169404d4377911`, and records SHA-256
checksums. It requires GitHub CLI authentication/network access. It never
imports or executes upstream application code. Existing pinned evidence files
are reused; remove a specific file before rerunning to fetch it again.

Issue and PR JSON are point-in-time observations. The exact commands are
`gh issue view ... --json ...`, `gh api .../issues/25/comments --paginate`,
`gh pr view ... --json ...` and `gh api .../pulls/...`. They are not asserted to
remain current as discussions change. See the study for the interpretation and
the capability matrix for distinctions between local implementations and plans.
