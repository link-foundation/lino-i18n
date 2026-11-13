Registry snapshot: 2026-11-13T22:32:46.290698+00:00. `Before` is main at 3da5027; `after` is this PR.

Language versions, package managers, build/security tools, the complete Python dependency table, and the Ruby/Docker scope determination.

| Dependency / tool | Before | After | Registry / release latest | Reason |
| --- | --- | --- | --- | --- |
| PyYAML | 6.0.3 | 6.0.3 | 6.0.3 | Only pip requirements dependency; no transitive dependencies. PyPI query and pip-audit saved. |
| Node.js | 24.x primary; 22.x / 26.x | 26.x primary; 22.x / 24.x | 26.13.1 LTS | Retain older supported LTS test legs; latest stable LTS primary, 27 prereleases excluded. |
| npm | 11.21.0 recovery; >=11.5.1 accepted; bundled CI | 12.2.2 in every install and release bootstrap | 12.2.2 | Major migration: pack JSON and supported Node patch floors; exact pin guard. BLOCKED tool security: official bundle has two published advisories; npm/cli#10299 and npm-tool-bundle.md. |
| Rust toolchain | stable; 1.87 MSRV | stable; 1.92 MSRV | 1.100.0 | Stable resolves current in CI; MSRV separately checks the supported floor including ICU. |
| Rust edition | 2024 | 2024 | 2024 | Latest stable edition; not a crate or a release channel. |
| Python | 3.14 | 3.15.2 | 3.15.2 | python.org release listing verified; source extraction retains Python 3.11+ compatibility. |
| Bun | 1.4.2 | 1.4.4 | bun-v1.4.4 | Current. |
| Deno | 2.9.7 | 2.9.8 | v2.9.8 | Current. |
| rust-script | 0.36.0 | 0.36.0 | 0.36.0 | Current. |
| cargo-audit | 0.22.2 | 0.23.0 | 0.23.0 | Current; prebuilt binary avoids local compilation. |
| zizmor | 1.30.1 | 1.32.0 | 1.32.0 | Current in both security modes. |
| pip-audit | absent | 2.10.1 | 2.10.1 | New required Python audit; all severities checked. |
| npm-check-updates | ad hoc | 23.1.1 | 23.1.1 | Research/update tool, not a shipped dependency. |
| cargo-edit | not installed | not installed | 0.13.14 | Registry-guided edits perform the same incompatible requirement refresh without compiling a one-off CLI. |
| Ruby / Bundler | no live manifest | no live manifest | v4.0.9 | Only two archived upstream .rb research files; no executable Ruby, gems, Gemfile, gemspec, or lockfile to update. |
| Docker base images | none | none | not applicable | No Dockerfile in live repository; composite accepts a caller-provided Dockerfile. Actionlint image is inventoried separately. |
