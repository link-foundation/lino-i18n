The same warning-only/ignored-I/O pattern also exists in `scripts/collect-changelog.rs` at template commit `cece347b3cd3a0b715583d7294e1fd93ad2d4c56`. `remove_fragments` ignores a failed `read_dir`, drops invalid entries, and ignores failed `remove_file` calls before `main` prints `Changelog collection complete`. Release fragments can remain available for another collection.

Minimal deterministic reproduction: append this module to that script and run `RUST_LOG=error rust-script --test scripts/collect-changelog.rs`. A directory replacing a previously collected fragment reproduces a file-deletion error on Linux, macOS and Windows without permission assumptions or a race in the test:

```rust
#[cfg(test)]
mod cleanup_tests {
    use super::remove_fragments;
    #[test]
    fn cleanup_must_report_deletion_failure() {
        let root = std::env::temp_dir().join(format!("fragment-removal-{}", std::process::id()));
        std::fs::create_dir(&root).unwrap();
        std::fs::create_dir(root.join("fragment.md")).unwrap();
        let result = std::panic::catch_unwind(|| remove_fragments(root.to_str().unwrap()));
        std::fs::remove_dir_all(root).unwrap();
        assert!(result.is_err(), "fragment deletion silently failed");
    }
}
```

The original implementation fails this test. Alternatively, on a non-root Unix account, make the fragment parent unwritable before calling cleanup; the fragment remains and the function still succeeds. The portable regression, original failing output and repaired output are preserved in [lino-i18n PR 24](https://github.com/link-foundation/lino-i18n/pull/24), under `verification/fragment-cleanup-before.log` and `fragment-cleanup-after.log`.

Workaround: run collection only with a writable, stable fragment directory and verify that every consumed fragment is absent afterward; fail the release if any remains. Avoid automatic retry after partial changelog mutation without restoring the previous state.

Suggested code change: return a `Result` from cleanup and propagate directory-entry/deletion errors through `main`, or use explicit fatal errors consistently with the other helpers. Print `Removed ...` only after successful deletion, include the failed path and OS error, and add the portable regression above. The repaired implementation also rejects directory-read errors instead of treating them as an empty collection.
