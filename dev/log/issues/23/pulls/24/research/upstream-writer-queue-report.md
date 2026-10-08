Follow-up from the complete CI review in link-foundation/lino-i18n#23 / PR 24: the current pinned JS and Rust templates still omit `queue: max` from shared writer groups. GitHub now documents and accepts that setting. With the default single pending slot, `cancel-in-progress: false` preserves the running writer but a third writer replaces/cancels the already-pending second writer.

Reproducible example: dispatch this workflow three times while the first job is still running (with at least three available runner slots):

```yaml
name: writer-queue-repro
on: workflow_dispatch
jobs:
  writer:
    runs-on: ubuntu-24.04
    concurrency:
      group: finite-writer-queue-repro
      cancel-in-progress: false
    steps:
      - run: sleep 30
```

Before: one running job, one pending job, and one cancelled pending job. After adding `queue: max`: all three complete serially. This is a finite probe and performs no writes/releases. The configuration defect is reproduced by our committed workflow policy assertion, with before/after logs in PR 24's `dev/log/issues/23/pulls/24/verification/writer-queue-*.log`.

Workaround and suggested code fix: restore `queue: max` on every noncancellable writer; keep read-only checks cancellable with the default single queue. Released actionlint 1.7.12 has a known schema lag (rhysd/actionlint#657, unmerged PR #654), so narrowly pass `-ignore 'unexpected key "queue" for "concurrency" section'` while a separate policy asserts writer `queue == "max"` and rejects `queue: max` combined with `cancel-in-progress: true`. Keep every other actionlint/ShellCheck/Pyflakes diagnostic enforced. Remove this narrow exception when a release includes #654.

Primary platform documentation: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency#example-queueing-multiple-pending-runs

Our implementation and evidence: https://github.com/link-foundation/lino-i18n/pull/24
