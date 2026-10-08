# Evidence for issue 23 and PR 24

Start with [ANALYSIS.md](ANALYSIS.md), [TEMPLATE-COMPARISON.md](TEMPLATE-COMPARISON.md) and [SOURCES.md](SOURCES.md). Historical and fresh CI logs remain directly readable in `ci-logs/`; their download manifest distinguishes successful retrieval from expired logs.

The 24 expired historical downloads (empty log files and GitHub's error messages) are bundled in `ci-logs/expired-log-downloads.tar.gz`. Each manifest entry retains its original path/checksum and identifies its archive member, error text and stderr checksum. Read an error directly with `tar -xOf ci-logs/expired-log-downloads.tar.gz javascript-26050991046.stderr`.

Their full run/job metadata is preserved in `github/historical-run-details.tar.gz`, with individual hashes in `historical-run-details-index.json`. For example, `tar -xOf github/historical-run-details.tar.gz javascript-26050991046.json` reads the original record. Metadata for the reported failures remains individual files. Fresh PR job metadata is in `github/pr-run-details.tar.gz` with `pr-run-details-index.json`; branch run lists and every available CI log remain directly readable.

The complete preserved template sources are in `templates/js-source.tar.gz` and `templates/rust-source.tar.gz`. Full tree JSON/text files, the 599-file comparison and `preserved-files.json` identify every path and checksum. The snapshots include workflows, actions, CI helpers/configuration and relevant regression tests. To inspect them locally, from this folder:

```bash
tar -xzf templates/js-source.tar.gz -C templates
tar -xzf templates/rust-source.tar.gz -C templates
```

Important local verification and before/after logs remain in `verification/`. Intermediate iterations are losslessly preserved in `verification/local-history.tar.gz`; `local-history-index.json` records each original filename, size and SHA-256. Inspect one without extracting the entire archive:

```bash
tar -xOf verification/local-history.tar.gz rust-release-before.log
```

Bundling raw snapshots and intermediate outputs keeps the reviewable PR below GitHub's 300-file diff limit. The initial implementation commit retains their original individual files in Git history. The archives contain the same original bytes; downloaded logs are never reformatted to satisfy source whitespace checks.

Final local check outputs are preserved in `verification/final-checks.tar.gz`, with each member's size and SHA-256 in `final-checks-index.json`. For example, `tar -xOf verification/final-checks.tar.gz final-node.log` reads the final Node test output. Before/after reproductions remain individual files.

`python3 experiments/issue-23-archive-integrity.py`, also required in Workflows CI, verifies every indexed archive member, downloaded CI log and expired-download error against its original byte count and checksum. The run-detail archiver selects only numeric run IDs, so repeated collection preserves its generated index.

The terminal validation of the evidence commit is downloaded into `verification/final-head/` using `experiments/issue-23-pr-ci.py --label final-head --destination dev/log/issues/23/pulls/24/verification/final-head`. This local directory is ignored: committing a commit's own CI logs creates another commit requiring new CI. Immutable run URLs, exact SHA and final results are recorded on PR 24. The preceding complete code-validation logs and all investigation/fix records are versioned here.
