# Issue 23 / PR 24 investigation and implementation plan

- [x] Collect the issue and every comment, PR metadata, conversation comments, inline review comments and reviews; preserve timestamps and commit SHAs.
- [x] Inspect repository instructions, contribution rules, full workflow/script tree, recent related merged PRs and existing case studies.
- [x] List recent branch/main CI runs, verify commit identities and timestamps, download all logs relevant to the reported failures and current PR.
- [x] Preserve the referenced JS/Rust templates, their complete tracked file trees and CI-related files, and the referenced CI/CD best-practices document.
- [x] Search authoritative online documentation and existing components; record sources and applicability.
- [x] Reconstruct the event timeline, enumerate every requirement, compare every workflow/CI script with both templates, and document roots, evidence and possible solutions.
- [x] Create minimal automated reproductions of actual defects before implementing fixes; keep experiments in experiments/ and bounded.
- [x] Implement all applicable fixes throughout the codebase, preserve existing behavior, and add opt-in diagnostics where evidence is insufficient.
- [x] Report reproducible template/upstream defects with examples, workarounds and code-level suggestions when applicable.
- [x] Run all repository tests and relevant local CI checks; preserve detailed logs; prepare the release trigger required by the repository.
- [x] Review the complete diff, ensure main is incorporated, make atomic commits and push only issue-23-bc288e2f1144.
- [x] Update PR 24 with reproduction, requirements/evidence, final behavior and verification; inspect fresh CI at the latest SHA, download non-passing logs and fix failures.

The final external-state checklist is recorded on PR 24 after the last evidence push: all five workflows at that exact SHA pass, final logs are collected locally, the PR is ready for review, main is incorporated and the working tree is clean. Its terminal CI logs remain local under `verification/final-head/` to avoid recursively creating another commit and CI run merely to record the preceding run.

Investigation artifacts are kept under this directory. Large command outputs are saved rather than streamed. No delegated agents or background work may be left running at completion.
