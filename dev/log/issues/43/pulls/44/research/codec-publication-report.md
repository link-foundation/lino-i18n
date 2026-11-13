The published Rust artifact still prevents consumers from adopting the current Links Notation grammar, although the migration is already on main.

Verified on 2026-11-13:

- crates.io's newest non-yanked `lino-objects-codec` is **0.9.3**; its published dependency requires `links-notation ^0.27.1`.
- Current repository `rust/Cargo.toml` still says version **0.9.3**, but now requires `links-notation 0.31.3`.
- The current `links-notation` registry release is **0.31.3**.

Minimal reproduction in a fresh crate (or the downstream workspace):

```sh
cargo add lino-objects-codec@0.9.3
cargo tree -i links-notation
# links-notation v0.27.1 <- lino-objects-codec v0.9.3
```

The downstream PR https://github.com/link-foundation/lino-i18n/pull/44 updates both runtime and proc-macro consumers to the latest published codec, but must retain the older transitive parser. It does not patch a pre-1.0 API across an incompatible range. Runtime, macro and optional ICU tests pass with that published release.

Please bump the Rust package patch version and publish the already migrated source, with codec round-trip/conformance tests and a post-publish check of the registry dependency metadata. Re-publishing changed content as 0.9.3 cannot repair the immutable registry artifact. This is a publication gap following the dependency work in #74 / #47, rather than a request to repeat their already merged source edits.
