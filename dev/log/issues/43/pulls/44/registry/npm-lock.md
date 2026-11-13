Registry snapshot: 2026-11-13T22:32:46.290698+00:00. `Before` is main at 3da5027; `after` is this PR.

Every unique direct/transitive package name, including removed packages and all platform-specific optional binaries. Full per-location data is in the inventory JSON and npm-parents.json. Older versions are parent-controlled compatibility exceptions, not silently claimed as latest.

| Dependency | Before resolved | After resolved | Registry latest | Reason |
| --- | --- | --- | --- | --- |
| @azu/format-text | 1.0.2 | 1.0.2 | 1.0.2 | Current. |
| @azu/style-format | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| @babel/code-frame | 7.29.7, 8.0.6 | 8.0.6, 7.29.7 | 8.0.6 | @babel/core@7.29.13 requires ^7.29.7; @babel/template@7.29.7 requires ^7.29.7; @babel/traverse@7.29.14 requires ^7.29.7; @tanstack/start-plugin-core@1.171.56 requires 7.29.7; @testing-library/dom@10.4.2 requires ^7.10.4; parse-json@8.3.0 requires ^7.26.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/compat-data | 8.0.5, 7.29.7 | 8.1.2, 7.29.7 | 8.1.2 | @babel/helper-compilation-targets@7.29.13 requires ^7.29.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/core | 8.1.0, 7.29.13 | 8.1.2, 7.29.13 | 8.1.2 | @babel/helper-module-transforms@7.29.14 requires ^7.0.0; @tanstack/router-plugin@1.169.0 requires ^7.29.7; @tanstack/start-plugin-core@1.171.56 requires ^7.29.7; babel-dead-code-elimination@1.0.12 requires ^7.23.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/eslint-parser | 8.0.7 | 8.1.2 | 8.1.2 | Current. |
| @babel/generator | 8.1.0, 7.29.13 | 8.1.2, 7.29.14 | 8.1.2 | @babel/core@7.29.13 requires ^7.29.13; @babel/traverse@7.29.14 requires ^7.29.14; @tanstack/router-utils@1.163.0 requires ^7.29.8. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/helper-compilation-targets | 8.0.7, 7.29.13 | 8.0.7, 7.29.13 | 8.0.7 | @babel/core@7.29.13 requires ^7.29.13. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/helper-globals | 8.0.6, 7.29.7 | 8.0.6, 7.29.7 | 8.0.6 | @babel/traverse@7.29.14 requires ^7.29.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/helper-module-imports | 7.29.7 | 7.29.7 | 8.0.0 | @babel/helper-module-transforms@7.29.14 requires ^7.29.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/helper-module-transforms | 7.29.13 | 7.29.14 | 8.1.2 | @babel/core@7.29.13 requires ^7.29.13. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/helper-string-parser | 7.29.13, 8.0.8 | 7.29.14, 8.1.2 | 8.1.2 | @babel/types@7.29.14 requires ^7.29.14. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/helper-validator-identifier | 8.0.6, 7.29.7 | 7.29.7, 8.0.6 | 8.0.6 | @babel/code-frame@7.29.7 requires ^7.29.7; @babel/helper-module-transforms@7.29.14 requires ^7.29.7; @babel/types@7.29.14 requires ^7.29.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/helper-validator-option | 8.0.0, 7.29.7 | 8.0.0, 7.29.7 | 8.0.0 | @babel/helper-compilation-targets@7.29.13 requires ^7.29.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/helpers | 8.1.0, 7.29.13 | 8.1.2, 7.29.14 | 8.1.2 | @babel/core@7.29.13 requires ^7.29.13. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/parser | 7.29.13, 8.1.0 | 7.29.14, 8.1.2 | 8.1.2 | @babel/core@7.29.13 requires ^7.29.13; @babel/generator@7.29.14 requires ^7.29.14; @babel/template@7.29.7 requires ^7.29.7; @babel/traverse@7.29.14 requires ^7.29.14; @tanstack/router-utils@1.163.0 requires ^7.29.8; @vue/compiler-core@3.5.45 requires ^7.29.12; @vue/compiler-sfc@3.5.45 requires ^7.29.12; babel-dead-code-elimination@1.0.12 requires ^7.23.6. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/runtime | 7.29.10 | 7.29.14 | 8.1.2 | @testing-library/dom@10.4.2 requires ^7.12.5; @testing-library/react@16.3.3 requires ^7.12.5; react-native-web@0.21.4 requires ^7.18.6. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/template | 8.0.0, 7.29.7 | 7.29.7, 8.1.2 | 8.1.2 | @babel/core@7.29.13 requires ^7.29.7; @babel/helpers@7.29.14 requires ^7.29.7; @babel/traverse@7.29.14 requires ^7.29.7; @tanstack/router-plugin@1.169.0 requires ^7.29.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/traverse | 7.29.13, 8.1.0 | 7.29.14, 8.1.2 | 8.1.2 | @babel/core@7.29.13 requires ^7.29.13; @babel/helper-module-imports@7.29.7 requires ^7.29.7; @babel/helper-module-transforms@7.29.14 requires ^7.29.14; babel-dead-code-elimination@1.0.12 requires ^7.23.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @babel/types | 7.29.11, 8.1.0 | 7.29.14, 8.1.2 | 8.1.2 | @babel/core@7.29.13 requires ^7.29.11; @babel/generator@7.29.14 requires ^7.29.14; @babel/helper-module-imports@7.29.7 requires ^7.29.7; @babel/helpers@7.29.14 requires ^7.29.14; @babel/parser@7.29.14 requires ^7.29.14; @babel/template@7.29.7 requires ^7.29.7; @babel/traverse@7.29.14 requires ^7.29.14; @tanstack/router-generator@1.168.0 requires ^7.29.8; @tanstack/router-plugin@1.169.0 requires ^7.29.8; @tanstack/router-utils@1.163.0 requires ^7.29.8; @tanstack/start-plugin-core@1.171.56 requires ^7.29.8; babel-dead-code-elimination@1.0.12 requires ^7.23.6. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @cacheable/memory | 2.2.0 | 2.2.0 | 2.2.0 | Current. |
| @cacheable/utils | 2.5.0 | 2.5.0 | 2.5.0 | Current. |
| @changesets/apply-release-plan | 8.1.1 | 8.1.1 | 8.1.1 | Current. |
| @changesets/assemble-release-plan | 7.0.0 | 7.0.0 | 7.0.0 | Current. |
| @changesets/changelog-git | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| @changesets/cli | 3.0.3 | 3.0.3 | 3.0.3 | Current. |
| @changesets/config | 4.0.1 | 4.0.1 | 4.0.1 | Current. |
| @changesets/errors | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| @changesets/format | 0.1.2 | 0.1.3 | 0.1.3 | Current. |
| @changesets/get-dependents-graph | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| @changesets/git | 4.0.1 | 4.0.1 | 4.0.1 | Current. |
| @changesets/parse | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| @changesets/pre | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| @changesets/read | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| @changesets/should-skip-package | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| @changesets/types | 7.0.0 | 7.0.0 | 7.0.0 | Current. |
| @changesets/write | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| @clack/core | 1.5.1 | 1.6.0 | 1.6.0 | Current. |
| @clack/prompts | 1.8.1 | 1.9.0 | 1.9.0 | Current. |
| @dual-bundle/import-meta-resolve | 4.2.1 | 4.2.1 | 4.2.1 | Current. |
| @emnapi/core | — | 2.0.0-beta.2 | 1.11.3 | @rolldown/binding-wasm32-wasi@1.2.19 requires 2.0.0-beta.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @emnapi/runtime | 1.11.3 | 1.11.3, 2.0.0-beta.2 | 1.11.3 | @rolldown/binding-wasm32-wasi@1.2.19 requires 2.0.0-beta.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @emnapi/wasi-threads | — | 2.2.0 | 2.2.0 | Current. |
| @esbuild/aix-ppc64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/android-arm | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/android-arm64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/android-x64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/darwin-arm64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/darwin-x64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/freebsd-arm64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/freebsd-x64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-arm | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-arm64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-ia32 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-loong64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-mips64el | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-ppc64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-riscv64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-s390x | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/linux-x64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/netbsd-arm64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/netbsd-x64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/openbsd-arm64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/openbsd-x64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/openharmony-arm64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/sunos-x64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/win32-arm64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/win32-ia32 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @esbuild/win32-x64 | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| @eslint-community/eslint-utils | 4.10.1 | 4.10.1 | 4.10.1 | Current. |
| @eslint-community/regexpp | 4.12.2 | 4.12.3 | 4.12.3 | Current. |
| @eslint/config-array | 0.23.5, 0.21.2 | 0.23.6, 0.21.2 | 0.23.6 | eslint@9.39.5 requires ^0.21.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @eslint/config-helpers | 0.7.0, 0.4.2 | 0.7.0, 0.4.2 | 0.7.0 | eslint@9.39.5 requires ^0.4.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @eslint/core | 1.2.1, 0.17.0 | 1.2.1, 0.17.0 | 1.2.1 | @eslint/config-helpers@0.4.2 requires ^0.17.0; @eslint/plugin-kit@0.4.1 requires ^0.17.0; eslint@9.39.5 requires ^0.17.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @eslint/eslintrc | 3.3.7 | 3.3.7 | 3.3.7 | Current. |
| @eslint/js | 10.0.1, 9.39.5 | 10.0.1, 9.39.5 | 10.0.1 | eslint@9.39.5 requires 9.39.5. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @eslint/object-schema | 3.0.5, 2.1.7 | 3.0.5, 2.1.7 | 3.0.5 | @eslint/config-array@0.21.2 requires ^2.1.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @eslint/plugin-kit | 0.7.3, 0.4.1 | 0.7.3, 0.4.1 | 0.7.3 | eslint@9.39.5 requires ^0.4.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @exodus/bytes | 1.16.0 | 1.16.0 | 1.16.0 | Current. |
| @formatjs/fast-memoize | 3.1.7 | 3.1.7 | 3.1.7 | Current. |
| @formatjs/icu-messageformat-parser | 3.5.22 | 3.5.23 | 3.5.23 | Current. |
| @formatjs/icu-skeleton-parser | 2.1.12 | 2.1.13 | 2.1.13 | Current. |
| @generaltranslation/api | 0.5.6 | 0.6.0 | 0.6.0 | Current. |
| @generaltranslation/format | 0.1.9 | 0.1.10 | 0.1.10 | Current. |
| @generaltranslation/icu | 0.1.2 | 0.1.2 | 0.1.2 | Current. |
| @generaltranslation/supported-locales | 2.1.45 | 2.1.48 | 2.1.48 | Current. |
| @humanfs/core | 0.19.2 | 0.19.2 | 0.20.0 | @humanfs/node@0.16.8 requires ^0.19.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @humanfs/node | 0.16.8 | 0.16.8 | 0.17.0 | eslint@10.15.0 requires ^0.16.8; eslint@9.39.5 requires ^0.16.6. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @humanfs/types | 0.15.0 | 0.15.0 | 0.16.0 | @humanfs/core@0.19.2 requires ^0.15.0; @humanfs/node@0.16.8 requires ^0.15.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @humanwhocodes/module-importer | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| @humanwhocodes/retry | 0.4.3 | 0.4.3 | 0.4.3 | Current. |
| @img/colour | 1.1.0 | 1.1.0 | 1.1.0 | Current. |
| @img/sharp-darwin-arm64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-darwin-x64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-freebsd-wasm32 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-libvips-darwin-arm64 | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-darwin-x64 | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-linux-arm | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-linux-arm64 | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-linux-ppc64 | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-linux-riscv64 | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-linux-s390x | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-linux-x64 | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-linuxmusl-arm64 | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-libvips-linuxmusl-x64 | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| @img/sharp-linux-arm | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-linux-arm64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-linux-ppc64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-linux-riscv64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-linux-s390x | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-linux-x64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-linuxmusl-arm64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-linuxmusl-x64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-wasm32 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-webcontainers-wasm32 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-win32-arm64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-win32-ia32 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @img/sharp-win32-x64 | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| @isaacs/nonrecursive-glob-match | — | 1.1.0 | 1.1.0 | Current. |
| @jridgewell/gen-mapping | 0.4.0-beta.0, 0.3.13 | 0.3.13, 0.4.0-beta.0 | 0.3.13 | @babel/generator@8.1.2 requires 0.4.0-beta.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @jridgewell/remapping | 2.3.5 | 2.3.5 | 2.3.5 | Current. |
| @jridgewell/resolve-uri | 3.1.2 | 3.1.3 | 3.1.3 | Current. |
| @jridgewell/sourcemap-codec | 1.6.0 | 1.6.0 | 1.6.0 | Current. |
| @jridgewell/trace-mapping | 0.3.31 | 0.3.31 | 0.3.31 | Current. |
| @keyv/bigmap | 1.3.1 | 1.3.1 | 6.1.0 | @cacheable/memory@2.2.0 requires ^1.3.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @keyv/serialize | 1.1.1 | 1.1.1 | 1.1.1 | Current. |
| @manypkg/find-root | 3.1.0 | 3.1.0 | 3.1.0 | Current. |
| @manypkg/get-packages | 3.1.0 | 3.1.0 | 3.1.0 | Current. |
| @manypkg/tools | 2.1.2 | 2.1.2 | 2.1.2 | Current. |
| @napi-rs/wasm-runtime | — | 1.2.6 | 1.2.7 | @rolldown/binding-wasm32-wasi@1.2.19 requires 1.2.6. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @next/env | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @next/swc-darwin-arm64 | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @next/swc-darwin-x64 | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @next/swc-linux-arm64-gnu | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @next/swc-linux-arm64-musl | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @next/swc-linux-x64-gnu | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @next/swc-linux-x64-musl | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @next/swc-win32-arm64-msvc | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @next/swc-win32-x64-msvc | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| @noble/hashes | 2.4.0 | 2.4.0 | 2.4.0 | Current. |
| @oozcitak/dom | 2.0.2 | 2.0.2 | 3.0.0 | xmlbuilder2@4.0.3 requires ^2.0.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @oozcitak/infra | 2.0.2 | 2.0.2 | 3.0.0 | @oozcitak/dom@2.0.2 requires ^2.0.2; @oozcitak/url@3.0.0 requires ^2.0.2; xmlbuilder2@4.0.3 requires ^2.0.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @oozcitak/url | 3.0.0 | 3.0.0 | 4.0.0 | @oozcitak/dom@2.0.2 requires ^3.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @oozcitak/util | 10.0.0 | 10.0.0 | 11.0.0 | @oozcitak/dom@2.0.2 requires ^10.0.0; @oozcitak/infra@2.0.2 requires ^10.0.0; @oozcitak/url@3.0.0 requires ^10.0.0; xmlbuilder2@4.0.3 requires ^10.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @oxc-project/types | 0.156.0 | 0.156.0 | 0.158.0 | rolldown@1.2.19 requires =0.156.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @pkgr/core | 0.3.6 | 0.3.6 | 0.3.6 | Current. |
| @playwright/test | 1.64.1 | 1.65.1 | 1.65.1 | Current. |
| @pnpm/deps.graph-sequencer | 1100.0.1 | 1100.0.1 | 1101.0.1 | @changesets/cli@3.0.3 requires ^1100.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @react-native/normalize-colors | 0.74.89 | 0.74.89 | 0.88.1 | react-native-web@0.21.4 requires ^0.74.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-android-arm-eabi | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-android-arm64 | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-darwin-arm64 | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-darwin-x64 | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-freebsd-x64 | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-linux-arm-gnueabihf | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-linux-arm64-gnu | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-linux-arm64-musl | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-linux-ppc64-gnu | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-linux-s390x-gnu | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-linux-x64-gnu | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-linux-x64-musl | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-openharmony-arm64 | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-wasm32-wasi | — | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-win32-arm64-msvc | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/binding-win32-x64-msvc | 1.2.16 | 1.2.19 | 1.3.2 | rolldown@1.2.19 requires 1.2.19. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @rolldown/pluginutils | 1.0.1 | 1.1.1 | 1.1.1 | Current. |
| @rollup/rollup-android-arm-eabi | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-android-arm64 | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-android-x64 | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-darwin-arm64 | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-darwin-x64 | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-freebsd-arm64 | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-freebsd-x64 | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-arm-gnueabihf | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-arm-musleabihf | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-arm64-gnu | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-arm64-musl | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-loong64-gnu | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-loong64-musl | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-ppc64-gnu | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-ppc64-musl | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-riscv64-gnu | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-riscv64-musl | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-s390x-gnu | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-x64-gnu | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-linux-x64-musl | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-openbsd-x64 | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-openharmony-arm64 | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-win32-arm64-msvc | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-win32-ia32-msvc | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-win32-x64-gnu | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rollup/rollup-win32-x64-msvc | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| @rrweb/record | 2.2.0 | 2.2.2 | 2.2.2 | Current. |
| @rrweb/replay | 2.2.0 | 2.2.2 | 2.2.2 | Current. |
| @rrweb/types | 2.2.0 | 2.2.2 | 2.2.2 | Current. |
| @rrweb/utils | 2.2.0 | 2.2.2 | 2.2.2 | Current. |
| @secretlint/config-creator | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/config-loader | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/core | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/formatter | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/node | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/profiler | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/resolver | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/secretlint-rule-preset-recommend | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/source-creator | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/types | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @secretlint/walker | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| @swc/helpers | 0.5.23 | 0.5.23 | 0.5.24 | next@16.4.6 requires 0.5.23. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @tanstack/history | 1.162.5 | 1.162.5 | 1.162.5 | Current. |
| @tanstack/react-router | 1.170.46 | 1.170.46 | 1.170.46 | Current. |
| @tanstack/react-start | 1.169.4 | 1.169.5 | 1.169.5 | Current. |
| @tanstack/react-start-client | 1.168.44 | 1.168.45 | 1.168.45 | Current. |
| @tanstack/react-start-rsc | 0.1.65 | 0.1.66 | 0.1.66 | Current. |
| @tanstack/react-start-server | 1.167.52 | 1.167.52 | 1.167.52 | Current. |
| @tanstack/react-store | 0.11.2 | 0.11.2 | 0.11.2 | Current. |
| @tanstack/router-core | 1.171.39 | 1.171.39 | 1.171.39 | Current. |
| @tanstack/router-generator | 1.167.46 | 1.168.0 | 1.168.0 | Current. |
| @tanstack/router-plugin | 1.168.48 | 1.169.0 | 1.169.0 | Current. |
| @tanstack/router-utils | 1.162.4 | 1.163.0 | 1.163.0 | Current. |
| @tanstack/start-client-core | 1.170.39 | 1.170.39 | 1.170.39 | Current. |
| @tanstack/start-fn-stubs | 1.162.0 | 1.162.0 | 1.162.0 | Current. |
| @tanstack/start-plugin-core | 1.171.55 | 1.171.56 | 1.171.56 | Current. |
| @tanstack/start-server-core | 1.169.45 | 1.169.45 | 1.169.45 | Current. |
| @tanstack/start-storage-context | 1.167.41 | 1.167.41 | 1.167.41 | Current. |
| @tanstack/store | 0.11.2 | 0.11.2 | 0.11.2 | Current. |
| @tanstack/virtual-file-routes | 1.162.0 | 1.162.0 | 1.162.0 | Current. |
| @testing-library/dom | 10.4.2 | 10.4.2 | 10.4.2 | Current. |
| @testing-library/react | 16.3.3 | 16.3.3 | 16.3.3 | Current. |
| @textlint/ast-node-types | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| @textlint/linter-formatter | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| @textlint/module-interop | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| @textlint/resolver | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| @textlint/types | 15.8.0 | 15.8.0 | 15.8.0 | Current. |
| @tybys/wasm-util | — | 0.10.4 | 0.10.4 | Current. |
| @types/aria-query | 5.0.4 | 5.0.4 | 5.0.4 | Current. |
| @types/css-font-loading-module | 0.0.7 | 0.0.7 | 0.0.14 | rrweb@2.2.2 requires 0.0.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @types/debug | 4.1.13 | 4.1.13 | 4.1.13 | Current. |
| @types/eslint | 9.6.1 | 9.6.1 | 9.6.1 | Current. |
| @types/esrecurse | 4.3.1 | 4.3.1 | 4.3.1 | Current. |
| @types/estree | 1.0.10 | 1.0.10 | 1.0.10 | Current. |
| @types/estree-jsx | 1.0.5 | 1.0.5 | 1.0.5 | Current. |
| @types/gensync | 1.0.5 | 1.0.5 | 1.0.5 | Current. |
| @types/hast | 3.0.5 | 3.0.5 | 3.0.5 | Current. |
| @types/jsesc | 2.5.1 | 2.5.1 | 3.0.3 | @babel/generator@8.1.2 requires ^2.5.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @types/json-schema | 7.0.15 | 7.0.15 | 7.0.15 | Current. |
| @types/mdast | 4.0.4 | 4.0.4 | 4.0.4 | Current. |
| @types/ms | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| @types/node | 26.6.6 | 26.6.6 | 26.6.6 | Current. |
| @types/normalize-package-data | 2.4.4 | 2.4.4 | 2.4.4 | Current. |
| @types/react | 19.3.0 | 19.3.0 | 19.3.0 | Current. |
| @types/unist | 3.0.3, 2.0.11 | 3.0.3, 2.0.11 | 3.0.3 | parse-entities@4.0.2 requires ^2.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| @typescript/typescript-aix-ppc64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-darwin-arm64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-darwin-x64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-freebsd-arm64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-freebsd-x64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-linux-arm | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-linux-arm64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-linux-loong64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-linux-mips64el | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-linux-ppc64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-linux-riscv64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-linux-s390x | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-linux-x64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-netbsd-arm64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-netbsd-x64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-openbsd-arm64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-openbsd-x64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-sunos-x64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-win32-arm64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @typescript/typescript-win32-x64 | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| @vitejs/plugin-react | 6.2.1 | 6.3.0 | 6.3.0 | Current. |
| @vue/compiler-core | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @vue/compiler-dom | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @vue/compiler-sfc | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @vue/compiler-ssr | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @vue/reactivity | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @vue/runtime-core | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @vue/runtime-dom | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @vue/server-renderer | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @vue/shared | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| @xstate/fsm | 1.6.5 | 1.6.5 | 2.1.0 | rrweb@2.2.2 requires ^1.4.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| acorn | 8.19.0 | 8.19.0 | 8.19.0 | Current. |
| acorn-jsx | 5.3.2 | 5.3.2 | 5.3.2 | Current. |
| ajv | 8.20.0, 6.15.0 | 8.20.0, 6.15.0 | 8.20.0 | @eslint/eslintrc@3.3.7 requires ^6.14.0; eslint@10.15.0 requires ^6.14.0; eslint@9.39.5 requires ^6.14.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| ansi-escapes | 7.3.0 | 7.3.0 | 7.3.0 | Current. |
| ansi-regex | 5.0.1, 6.4.0 | 5.0.1, 6.6.0 | 6.6.0 | pretty-format@27.5.1 requires ^5.0.1; strip-ansi@6.0.1 requires ^5.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| ansi-styles | 5.2.0, 4.3.0, 6.2.3 | 4.3.0, 5.2.0, 6.2.3 | 7.0.0 | chalk@4.1.2 requires ^4.1.0; pretty-format@27.5.1 requires ^5.0.0; slice-ansi@4.0.0 requires ^4.0.0; wrap-ansi@9.0.2 requires ^6.2.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| ansis | 4.5.0 | 4.5.0 | 4.5.0 | Current. |
| argparse | 2.0.1 | 2.0.1 | 3.0.4 | js-yaml@4.3.2 requires ^2.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| aria-query | 5.3.0 | 5.3.0 | 5.3.2 | @testing-library/dom@10.4.2 requires 5.3.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| asap | 2.0.6 | 2.0.6 | 2.0.6 | Current. |
| astral-regex | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| babel-dead-code-elimination | 1.0.12 | 1.0.12 | 2.0.0 | @tanstack/router-utils@1.163.0 requires ^1.0.12. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| bail | 2.0.2 | 2.0.2 | 2.0.2 | Current. |
| balanced-match | 1.0.2, 4.0.4 | 1.0.2, 4.0.4 | 5.0.0 | brace-expansion@1.1.22 requires ^1.0.0; brace-expansion@5.0.13 requires ^4.0.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| base64-arraybuffer | 1.0.2 | 1.0.2 | 1.0.2 | Current. |
| baseline-browser-mapping | 2.11.27 | 2.11.37 | 2.11.37 | Current. |
| bcp-47 | 2.1.2 | 2.1.2 | 2.1.2 | Current. |
| bcp-47-match | 2.0.3 | 2.0.3 | 2.0.3 | Current. |
| binaryextensions | 6.11.0 | 6.11.0 | 6.11.0 | Current. |
| boundary | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| brace-expansion | 1.1.21, 5.0.12 | 1.1.22, 5.0.13 | 5.0.13 | minimatch@3.1.5 requires ^1.1.7. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| browserslist | 4.29.3 | 4.29.5 | 4.29.5 | Current. |
| cac | 7.0.1 | 7.1.0 | 7.1.0 | Current. |
| cacheable | 2.5.0 | 2.5.0 | 2.5.0 | Current. |
| callsites | 3.1.0 | 3.1.0 | 4.2.0 | parent-module@1.0.1 requires ^3.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| caniuse-lite | 1.0.30001815 | 1.0.30001826 | 1.0.30001826 | Current. |
| ccount | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| chalk | 5.6.2, 4.1.2 | 5.6.2, 4.1.2 | 6.0.1 | @secretlint/formatter@13.1.0 requires ^5.6.2; eslint@9.39.5 requires ^4.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| character-entities | 2.0.2 | 2.0.2 | 2.0.2 | Current. |
| character-entities-html4 | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| character-entities-legacy | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| character-reference-invalid | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| chokidar | 5.0.0 | 5.0.0 | 6.0.0 | @tanstack/router-plugin@1.169.0 requires ^5.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| client-only | 0.0.1 | 0.0.1 | 0.0.1 | Current. |
| cliui | 9.0.1 | 9.0.1 | 9.0.1 | Current. |
| color-convert | 2.0.1 | 2.0.1 | 3.1.3 | ansi-styles@4.3.0 requires ^2.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| color-name | 1.1.4 | 1.1.4 | 2.1.1 | color-convert@2.0.1 requires ~1.1.4. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| concat-map | 0.0.1 | 0.0.1 | 0.0.2 | brace-expansion@1.1.22 requires 0.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| convert-source-map | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| cookie-es | 3.1.1 | 3.1.1 | 3.1.1 | Current. |
| cross-fetch | 3.2.0 | 3.2.0 | 4.1.0 | fbjs@3.0.5 requires ^3.1.5. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| cross-spawn | 7.0.6 | 7.0.6 | 7.0.6 | Current. |
| css-in-js-utils | 3.1.0 | 3.1.0 | 3.1.0 | Current. |
| csstype | 3.2.3 | 3.2.3 | 3.2.3 | Current. |
| data-urls | 8.0.0 | 8.0.0 | 8.0.0 | Current. |
| debug | 4.4.3 | 4.4.3 | 4.4.3 | Current. |
| decimal.js | 10.6.0 | 10.6.0 | 10.6.0 | Current. |
| decode-named-character-reference | 1.3.0 | 1.3.0 | 1.3.0 | Current. |
| deep-is | 0.1.4 | 0.1.4 | 0.1.4 | Current. |
| dequal | 2.0.3 | 2.0.3 | 2.0.3 | Current. |
| detect-libc | 2.1.2 | 2.1.2 | 2.1.2 | Current. |
| devlop | 1.1.0 | 1.1.0 | 1.1.0 | Current. |
| diff | 9.0.0 | 9.0.0 | 9.0.0 | Current. |
| dom-accessibility-api | 0.5.16 | 0.5.16 | 0.7.1 | @testing-library/dom@10.4.2 requires ^0.5.9. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| editions | 6.22.0 | 6.22.0 | 6.22.0 | Current. |
| electron-to-chromium | 1.5.451 | 1.5.485 | 1.5.485 | Current. |
| emoji-regex | 10.6.0, 8.0.0 | 10.6.0, 8.0.0 | 11.0.0 | string-width@4.2.3 requires ^8.0.0; string-width@7.2.0 requires ^10.3.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| empathic | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| entities | 7.0.1, 9.0.0 | 7.0.1, 9.0.0 | 9.0.0 | @vue/compiler-core@3.5.45 requires ^7.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| environment | 1.1.0 | 1.1.0 | 1.1.0 | Current. |
| esbuild | 0.28.2 | 0.28.2 | 0.28.2 | Current. |
| escalade | 3.2.0 | 3.2.0 | 3.2.0 | Current. |
| escape-string-regexp | 4.0.0, 5.0.0 | 4.0.0, 5.0.0 | 5.0.0 | eslint@10.15.0 requires ^4.0.0; eslint@9.39.5 requires ^4.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| eslint | 10.14.0, 9.39.5 | 10.15.0, 9.39.5 | 10.15.0 | lino-i18n (root) requires ^9.39.5. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. ESLint 9 is an intentional compatibility fixture; ESLint 10 is the primary linter. |
| eslint-config-prettier | 10.1.8 | 10.1.8 | 10.1.8 | Current. |
| eslint-plugin-prettier | 5.5.7 | 5.5.7 | 5.5.7 | Current. |
| eslint-scope | 9.1.2, 8.4.0 | 9.1.2, 8.4.0 | 9.1.2 | eslint@9.39.5 requires ^8.4.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| eslint-visitor-keys | 3.4.3, 4.2.1, 5.0.1 | 3.4.3, 4.2.1, 5.0.1 | 5.0.1 | @eslint-community/eslint-utils@4.10.1 requires ^3.4.3; eslint@9.39.5 requires ^4.2.1; espree@10.4.0 requires ^4.2.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| espree | 10.4.0, 11.2.0 | 10.4.0, 11.2.0 | 11.2.0 | @eslint/eslintrc@3.3.7 requires ^10.0.1; eslint@9.39.5 requires ^10.4.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| esquery | 1.7.0 | 1.7.0 | 1.7.0 | Current. |
| esrecurse | 4.3.0 | 4.3.0 | 4.3.0 | Current. |
| estraverse | 5.3.0 | 5.3.0 | 5.3.0 | Current. |
| estree-util-is-identifier-name | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| estree-util-visit | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| estree-walker | 2.0.2 | 2.0.2 | 3.0.3 | @vue/compiler-core@3.5.45 requires ^2.0.2; @vue/compiler-sfc@3.5.45 requires ^2.0.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| esutils | 2.0.3 | 2.0.3 | 2.0.3 | Current. |
| exsolve | 1.2.0 | 1.2.0 | 1.2.0 | Current. |
| extend | 3.0.2 | 3.0.2 | 3.0.2 | Current. |
| fast-deep-equal | 3.1.3 | 3.1.3 | 3.1.3 | Current. |
| fast-diff | 1.3.0 | 1.3.0 | 1.3.0 | Current. |
| fast-json-stable-stringify | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| fast-levenshtein | 2.0.6 | 2.0.6 | 3.0.0 | optionator@0.9.4 requires ^2.0.6. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| fast-string-truncated-width | 3.0.3 | 3.0.3 | 3.0.3 | Current. |
| fast-string-width | 3.0.2 | 3.0.2 | 3.0.2 | Current. |
| fast-uri | 3.1.9 | 3.1.9 | 4.2.3 | ajv@8.20.0 requires ^3.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| fast-wrap-ansi | 0.2.2 | 0.2.2 | 0.2.2 | Current. |
| fbjs | 3.0.5 | 3.0.5 | 3.0.5 | Current. |
| fbjs-css-vars | 1.0.2 | 1.0.2 | 1.0.2 | Current. |
| fdir | 6.5.0 | 6.5.0 | 6.5.0 | Current. |
| fetchdts | 0.2.0 | 0.2.0 | 0.2.0 | Current. |
| file-entry-cache | 8.0.0, 11.1.5 | 8.0.0, 11.1.5 | 11.1.5 | eslint@9.39.5 requires ^8.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| find-up | 5.0.0 | 5.0.0 | 8.0.0 | eslint@10.15.0 requires ^5.0.0; eslint@9.39.5 requires ^5.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| flat-cache | 4.0.1, 6.1.23 | 4.0.1, 6.1.23 | 6.1.23 | file-entry-cache@8.0.0 requires ^4.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| flatted | 3.4.4 | 3.4.4 | 3.4.4 | Current. |
| flru | 1.0.2 | 1.0.2 | 1.0.2 | Current. |
| fsevents | 2.3.3 | 2.3.3 | 2.3.3 | Current. |
| generaltranslation | 9.5.9 | 9.5.12 | 9.5.12 | Current. |
| gensync | 1.0.0-beta.2 | 1.0.0-beta.2 | 1.0.0-beta.2 | Current. |
| get-caller-file | 2.0.5 | 2.0.5 | 2.0.5 | Current. |
| get-east-asian-width | 1.7.0 | 1.7.0 | 1.7.0 | Current. |
| getenv | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| glob-parent | 6.0.2 | 6.0.2 | 6.0.2 | Current. |
| globals | 14.0.0 | 14.0.0 | 17.14.0 | @eslint/eslintrc@3.3.7 requires ^14.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| gt-remark | 1.0.12 | 1.0.12 | 1.0.12 | Current. |
| gt-rrweb | 0.2.0 | 0.2.0 | 0.2.0 | Current. |
| has-flag | 4.0.0, 5.0.1 | 4.0.0, 5.0.1 | 5.0.1 | supports-color@7.2.0 requires ^4.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| hashery | 1.5.1 | 1.5.1 | 3.0.6 | @cacheable/utils@2.5.0 requires ^1.5.1; @keyv/bigmap@1.3.1 requires ^1.4.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| hookified | 1.15.1, 2.2.0 | 1.15.1, 2.2.0 | 3.1.0 | @cacheable/memory@2.2.0 requires ^1.15.1; @keyv/bigmap@1.3.1 requires ^1.15.0; cacheable@2.5.0 requires ^1.15.0; flat-cache@6.1.23 requires ^1.15.0; hashery@1.5.1 requires ^1.15.0; qified@0.10.1 requires ^2.1.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| hosted-git-info | 9.0.3 | 9.0.3 | 10.1.1 | normalize-package-data@8.0.0 requires ^9.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| html-encoding-sniffer | 7.0.0 | 7.0.0 | 7.0.0 | Current. |
| human-id | 4.2.2 | 4.2.2 | 4.2.2 | Current. |
| hyphenate-style-name | 1.1.0 | 1.1.0 | 1.1.0 | Current. |
| ignore | 7.0.14, 5.3.2 | 7.0.14, 5.3.2 | 7.0.14 | @eslint/eslintrc@3.3.7 requires ^5.2.0; eslint@10.15.0 requires ^5.2.0; eslint@9.39.5 requires ^5.2.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| import-fresh | 3.3.1 | 3.3.1 | 4.0.1 | @eslint/eslintrc@3.3.7 requires ^3.2.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| import-meta-resolve | 4.2.0 | 4.2.0 | 4.2.0 | Current. |
| imurmurhash | 0.1.4 | 0.1.4 | 0.1.4 | Current. |
| index-to-position | 1.2.0 | 1.2.0 | 1.2.0 | Current. |
| inline-style-prefixer | 7.0.1 | 7.0.1 | 7.0.1 | Current. |
| intl-messageformat | 12.1.4 | 12.1.5 | 12.1.5 | Current. |
| is-alphabetical | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| is-alphanumerical | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| is-decimal | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| is-extglob | 2.1.1 | 2.1.1 | 2.1.1 | Current. |
| is-fullwidth-code-point | 3.0.0 | 3.0.0 | 5.1.0 | slice-ansi@4.0.0 requires ^3.0.0; string-width@4.2.3 requires ^3.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| is-glob | 4.0.3 | 4.0.3 | 4.0.3 | Current. |
| is-hexadecimal | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| is-plain-obj | 4.1.0 | 4.1.0 | 4.1.0 | Current. |
| is-potential-custom-element-name | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| isbot | 5.2.2 | 5.2.3 | 5.2.3 | Current. |
| isexe | 2.0.0 | 2.0.0 | 4.0.0 | which@2.0.2 requires ^2.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| istextorbinary | 9.5.0 | 9.5.0 | 9.5.0 | Current. |
| jiti | 2.7.0 | 2.7.0 | 2.7.0 | Current. |
| jju | 1.4.0 | 1.4.0 | 1.4.0 | Current. |
| js-tokens | 10.0.0, 4.0.0 | 4.0.0, 10.0.0 | 10.0.0 | @babel/code-frame@7.29.7 requires ^4.0.0; loose-envify@1.4.0 requires ^3.0.0 \|\| ^4.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| js-yaml | 4.3.2 | 4.3.2 | 5.5.0 | @eslint/eslintrc@3.3.7 requires ^4.3.2; @textlint/linter-formatter@15.8.0 requires ^4.3.0; rc-config-loader@4.1.4 requires ^4.1.1; xmlbuilder2@4.0.3 requires ^4.1.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| jscpd | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jscpd-darwin-arm64 | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jscpd-darwin-x64 | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jscpd-linux-arm64-gnu | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jscpd-linux-arm64-musl | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jscpd-linux-x64-gnu | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jscpd-linux-x64-musl | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jscpd-windows-arm64-msvc | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jscpd-windows-x64-msvc | 5.4.2 | 5.4.3 | 5.4.3 | Current. |
| jsdom | 31.0.0 | 31.0.1 | 31.0.1 | Current. |
| jsesc | 3.1.0 | 3.1.0 | 3.1.0 | Current. |
| json-buffer | 3.0.1 | 3.0.1 | 3.0.1 | Current. |
| json-schema-traverse | 1.0.0, 0.4.1 | 1.0.0, 0.4.1 | 1.0.0 | ajv@6.15.0 requires ^0.4.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| json-stable-stringify-without-jsonify | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| json5 | 2.2.3 | 2.2.3 | 2.2.3 | Current. |
| jsonc-parser | 3.3.1 | 3.3.1 | 3.3.1 | Current. |
| keyv | 4.5.4, 5.6.0 | 4.5.4, 5.6.0 | 6.1.0 | @cacheable/memory@2.2.0 requires ^5.6.0; @cacheable/utils@2.5.0 requires ^5.6.0; @keyv/bigmap@1.3.1 requires ^5.6.0; cacheable@2.5.0 requires ^5.6.0; flat-cache@4.0.1 requires ^4.5.4. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| launch-editor | 2.14.2 | 2.14.2 | 2.14.2 | Current. |
| levn | 0.4.1 | 0.4.1 | 0.4.1 | Current. |
| lightningcss | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-android-arm64 | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-darwin-arm64 | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-darwin-x64 | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-freebsd-x64 | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-linux-arm-gnueabihf | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-linux-arm64-gnu | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-linux-arm64-musl | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-linux-x64-gnu | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-linux-x64-musl | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-win32-arm64-msvc | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| lightningcss-win32-x64-msvc | 1.33.0 | 1.33.0 | 1.33.0 | Current. |
| links-notation | 0.30.1, 0.27.1, 0.11.2 | 0.31.3, 0.11.2 | 0.31.3 | lino-env@0.2.8 requires ^0.11.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| lino-arguments | 0.4.0 | 0.4.1 | 0.4.1 | Current. |
| lino-env | 0.2.8 | 0.2.8 | 0.2.8 | Current. |
| lino-objects-codec | 0.9.5 | 0.9.6 | 0.9.6 | Current. |
| locate-path | 6.0.0 | 6.0.0 | 8.0.0 | find-up@5.0.0 requires ^6.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| lodash | 4.18.1 | 4.18.1 | 4.18.1 | Current. |
| lodash.merge | 4.6.2 | 4.6.2 | 4.6.2 | Current. |
| longest-streak | 3.1.0 | 3.1.0 | 3.1.0 | Current. |
| loose-envify | 1.4.0 | 1.4.0 | 1.4.0 | Current. |
| lru-cache | 5.1.1, 11.5.3 | 5.1.1, 11.5.3 | 11.5.3 | @babel/helper-compilation-targets@7.29.13 requires ^5.1.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| lz-string | 1.5.0 | 1.5.0 | 1.5.0 | Current. |
| magic-string | 0.30.21 | 0.30.21 | 1.4.5 | @tanstack/router-generator@1.168.0 requires ^0.30.21; @vue/compiler-sfc@3.5.45 requires ^0.30.21. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| markdown-table | 3.0.4 | 3.1.0 | 3.1.0 | Current. |
| mdast-util-find-and-replace | 3.0.3 | 3.0.4 | 3.0.4 | Current. |
| mdast-util-from-markdown | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| mdast-util-gfm-footnote | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| mdast-util-gfm-strikethrough | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| mdast-util-gfm-table | 2.0.0 | 2.0.1 | 2.0.1 | Current. |
| mdast-util-gfm-task-list-item | 2.0.0 | 2.0.1 | 2.0.1 | Current. |
| mdast-util-mdx | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| mdast-util-mdx-expression | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| mdast-util-mdx-jsx | 3.2.0 | 3.2.1 | 3.2.1 | Current. |
| mdast-util-mdxjs-esm | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| mdast-util-phrasing | 4.1.0 | 4.1.0 | 4.1.0 | Current. |
| mdast-util-to-markdown | 2.2.0 | 2.2.3 | 2.2.3 | Current. |
| mdast-util-to-string | 4.0.0 | 4.0.0 | 4.0.0 | Current. |
| memoize-one | 6.0.0 | 6.0.0 | 6.0.0 | Current. |
| micromark | 4.0.3 | 4.0.3 | 4.0.3 | Current. |
| micromark-core-commonmark | 2.0.4 | 2.0.4 | 2.0.4 | Current. |
| micromark-extension-gfm-footnote | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| micromark-extension-gfm-strikethrough | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| micromark-extension-gfm-table | 2.1.2 | 2.1.2 | 2.1.2 | Current. |
| micromark-extension-gfm-task-list-item | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| micromark-extension-mdx-expression | 3.0.1 | 3.0.1 | 3.0.1 | Current. |
| micromark-extension-mdx-jsx | 3.0.2 | 3.0.2 | 3.0.2 | Current. |
| micromark-extension-mdx-md | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| micromark-extension-mdxjs | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| micromark-extension-mdxjs-esm | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| micromark-factory-destination | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-factory-label | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-factory-mdx-expression | 2.0.3 | 2.0.3 | 2.0.3 | Current. |
| micromark-factory-space | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| micromark-factory-title | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-factory-whitespace | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-character | 2.1.1 | 2.1.1 | 2.1.1 | Current. |
| micromark-util-chunked | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-classify-character | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-combine-extensions | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-decode-numeric-character-reference | 2.0.2 | 2.0.2 | 2.0.2 | Current. |
| micromark-util-decode-string | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-edit-map | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| micromark-util-encode | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-events-to-acorn | 2.0.3 | 2.0.3 | 2.0.3 | Current. |
| micromark-util-html-tag-name | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-normalize-identifier | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-resolve-all | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-sanitize-uri | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-subtokenize | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| micromark-util-symbol | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| micromark-util-types | 2.0.3 | 2.0.3 | 2.0.3 | Current. |
| minimatch | 3.1.5, 10.2.6 | 3.1.5, 11.0.8 | 11.0.8 | @eslint/config-array@0.21.2 requires ^3.1.5; @eslint/eslintrc@3.3.7 requires ^3.1.5; eslint@9.39.5 requires ^3.1.5. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| mitt | 3.0.1 | 3.0.1 | 3.0.1 | Current. |
| ms | 2.1.3 | 2.1.3 | 2.1.3 | Current. |
| nanoid | 3.3.20 | 3.3.20 | 6.0.2 | postcss@8.5.23 requires ^3.3.16; postcss@8.5.32 requires ^3.3.20. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| natural-compare | 1.4.0 | 1.4.0 | 1.4.0 | Current. |
| next | 16.4.5 | 16.4.6 | 16.4.6 | Current. |
| node-fetch | 2.7.0 | 2.7.0 | 3.3.2 | cross-fetch@3.2.0 requires ^2.7.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| node-releases | 2.0.58 | 2.0.64 | 2.0.64 | Current. |
| normalize-package-data | 8.0.0 | 8.0.0 | 9.0.0 | read-pkg@10.1.0 requires ^8.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| nullthrows | 1.1.1 | 1.1.1 | 1.1.1 | Current. |
| object-assign | 4.1.1 | 4.1.1 | 4.1.1 | Current. |
| obug | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| optionator | 0.9.4 | 0.9.4 | 0.9.4 | Current. |
| p-limit | 3.1.0 | 3.1.0 | 7.3.3 | p-locate@5.0.0 requires ^3.0.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| p-locate | 5.0.0 | 5.0.0 | 7.0.0 | locate-path@6.0.0 requires ^5.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| p-map | 7.1.1 | 7.1.1 | 7.1.1 | Current. |
| package-manager-detector | 1.9.0 | 1.9.0 | 1.9.0 | Current. |
| parent-module | 1.0.1 | 1.0.1 | 3.2.0 | import-fresh@3.3.1 requires ^1.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| parse-entities | 4.0.2 | 4.0.2 | 4.0.2 | Current. |
| parse-json | 8.3.0 | 8.3.0 | 8.3.0 | Current. |
| parse5 | 8.1.0 | 8.1.1 | 8.1.1 | Current. |
| parse5-parser-stream | 8.1.0 | 8.1.1 | 8.1.1 | Current. |
| path-exists | 4.0.0 | 4.0.0 | 5.0.0 | find-up@5.0.0 requires ^4.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| path-key | 3.1.1 | 3.1.1 | 4.0.0 | cross-spawn@7.0.6 requires ^3.1.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| pathe | 2.0.3 | 2.0.3 | 2.0.3 | Current. |
| picocolors | 1.1.1 | 1.1.1 | 1.1.1 | Current. |
| picomatch | 4.0.7 | 4.0.7 | 4.0.7 | Current. |
| playwright | 1.64.1 | 1.65.1 | 1.65.1 | Current. |
| playwright-core | 1.64.1 | 1.65.1 | 1.65.1 | Current. |
| pluralize | 2.0.0, 8.0.0 | 2.0.0, 8.0.0 | 8.0.0 | @textlint/linter-formatter@15.8.0 requires ^2.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| postcss | 8.5.32, 8.5.23 | 8.5.23, 8.5.32 | 8.5.32 | next@16.4.6 requires 8.5.23. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| postcss-value-parser | 4.2.0 | 4.2.0 | 4.2.0 | Current. |
| prelude-ls | 1.2.1 | 1.2.1 | 1.2.1 | Current. |
| prettier | 3.9.10 | 3.10.1 | 3.10.1 | Current. |
| prettier-linter-helpers | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| pretty-format | 27.5.1 | 27.5.1 | 30.5.1 | @testing-library/dom@10.4.2 requires ^27.0.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| promise | 7.3.1 | 7.3.1 | 8.3.0 | fbjs@3.0.5 requires ^7.1.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| punycode | 2.3.1 | 2.3.1 | 2.3.1 | Current. |
| qified | 0.10.1 | 0.10.1 | 0.13.2 | cacheable@2.5.0 requires ^0.10.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| rc-config-loader | 4.1.4 | 4.1.4 | 4.1.4 | Current. |
| react | 19.3.1 | 19.3.1 | 19.3.1 | Current. |
| react-dom | 19.3.1 | 19.3.1 | 19.3.1 | Current. |
| react-is | 17.0.2 | 17.0.2 | 19.3.1 | pretty-format@27.5.1 requires ^17.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| react-native-web | 0.21.4 | 0.21.4 | 0.21.4 | Current. |
| read-pkg | 10.1.0 | 10.1.0 | 10.1.0 | Current. |
| readdirp | 5.1.1 | 5.1.1 | 5.1.1 | Current. |
| remark-mdx | 3.1.1 | 3.1.1 | 3.1.1 | Current. |
| remark-parse | 11.0.0 | 11.0.0 | 11.0.0 | Current. |
| remark-stringify | 11.0.0 | 11.0.0 | 11.0.0 | Current. |
| require-from-string | 2.0.2 | 2.0.2 | 2.0.2 | Current. |
| resolve-from | 4.0.0 | 4.0.0 | 5.0.0 | import-fresh@3.3.1 requires ^4.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| rolldown | 1.2.16 | 1.2.19 | 1.3.2 | vite@8.3.8 requires ~1.2.18. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| rollup | 4.67.5 | 4.68.3 | 4.68.3 | Current. |
| rrdom | 2.2.0 | 2.2.2 | 2.2.2 | Current. |
| rrweb | 2.2.0 | 2.2.2 | 2.2.2 | Current. |
| rrweb-snapshot | 2.2.0 | 2.2.2 | 2.2.2 | Current. |
| saxes | 6.0.0 | 6.0.0 | 6.0.0 | Current. |
| scheduler | 0.28.0 | 0.28.0 | 0.28.0 | Current. |
| secretlint | 13.1.0 | 13.1.0 | 13.1.0 | Current. |
| semver | 6.3.2, 7.8.5 | 6.3.2, 7.8.6 | 7.8.6 | @babel/core@7.29.13 requires ^6.3.1; @babel/helper-compilation-targets@7.29.13 requires ^6.3.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| seroval | 1.6.8 | 1.8.1 | 1.8.1 | Current. |
| seroval-plugins | 1.6.8 | 1.8.0 | 1.8.0 | Current. |
| setimmediate | 1.0.5 | 1.0.5 | 1.0.5 | Current. |
| sharp | 0.35.5 | 0.35.5 | 0.35.5 | Current. |
| shebang-command | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| shebang-regex | 3.0.0 | 3.0.0 | 4.0.0 | shebang-command@2.0.0 requires ^3.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| shell-quote | 1.12.0 | 1.12.0 | 1.12.0 | Current. |
| sisteransi | 1.0.5 | 2.0.0 | 2.0.0 | Current. |
| slice-ansi | 4.0.0 | 4.0.0 | 10.0.1 | table@6.10.1 requires ^4.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| source-map | 0.7.6 | 0.7.6 | 0.8.0 | @tanstack/start-plugin-core@1.171.56 requires ^0.7.6. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| source-map-js | 1.2.2 | 1.2.2 | 1.2.2 | Current. |
| spdx-correct | 3.2.0 | 3.2.0 | 3.2.0 | Current. |
| spdx-exceptions | 2.5.0 | 2.5.0 | 2.5.0 | Current. |
| spdx-expression-parse | 3.0.1 | 3.0.1 | 5.0.0 | spdx-correct@3.2.0 requires ^3.0.0; validate-npm-package-license@3.0.4 requires ^3.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| spdx-license-ids | 3.0.24 | 3.0.24 | 3.0.24 | Current. |
| srvx | 1.0.8 | 1.0.8 | 1.0.8 | Current. |
| string-width | 7.2.0, 4.2.3, 8.3.0 | 7.2.0, 4.2.3, 8.3.0 | 9.0.0 | @textlint/linter-formatter@15.8.0 requires ^4.2.3; cliui@9.0.1 requires ^7.2.0; table@6.10.1 requires ^4.2.3; wrap-ansi@9.0.2 requires ^7.0.0; yargs@18.2.0 requires ^8.2.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| stringify-entities | 4.0.4 | 4.0.4 | 4.0.4 | Current. |
| strip-ansi | 6.0.1, 7.2.0 | 7.2.0, 6.0.1 | 7.2.0 | @textlint/linter-formatter@15.8.0 requires ^6.0.1; string-width@4.2.3 requires ^6.0.1; table@6.10.1 requires ^6.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| strip-json-comments | 3.1.1 | 3.1.1 | 5.0.3 | @eslint/eslintrc@3.3.7 requires ^3.1.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| structured-source | 4.0.0 | 4.0.0 | 4.0.0 | Current. |
| styled-jsx | 5.1.6 | 5.1.6 | 5.1.7 | next@16.4.6 requires 5.1.6. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| styleq | 0.1.3 | 0.1.3 | 0.2.1 | react-native-web@0.21.4 requires ^0.1.3. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| supports-color | 7.2.0, 10.2.2 | 7.2.0, 10.2.2 | 11.0.0 | chalk@4.1.2 requires ^7.1.0; supports-hyperlinks@4.6.0 requires ^10.2.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| supports-hyperlinks | 4.6.0 | 4.6.0 | 5.0.0 | terminal-link@5.0.0 requires ^4.1.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| synckit | 0.12.3 | 0.12.3 | 0.12.3 | Current. |
| table | 6.10.1 | 6.10.1 | 6.10.1 | Current. |
| tagged-tag | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| terminal-link | 5.0.0 | 5.0.0 | 5.0.0 | Current. |
| test-anywhere | 0.9.1 | 0.9.1 | 0.9.1 | Current. |
| text-table | 0.2.0 | 0.2.0 | 0.2.0 | Current. |
| textextensions | 6.11.0 | 6.11.0 | 6.11.0 | Current. |
| tinyexec | 1.3.1 | 1.3.1 | 1.3.1 | Current. |
| tinyglobby | 0.2.17 | 0.2.17 | 0.2.17 | Current. |
| tldts | 7.4.18 | 7.5.2 | 7.5.2 | Current. |
| tldts-core | 7.4.18 | 7.5.2 | 7.5.2 | Current. |
| tough-cookie | 6.0.2 | 6.1.0 | 6.1.0 | Current. |
| tr46 | 0.0.3, 7.0.0 | 0.0.3, 7.0.0 | 7.0.0 | whatwg-url@5.0.0 requires ~0.0.3. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| trough | 2.2.0 | 2.2.0 | 2.2.0 | Current. |
| tslib | 2.8.1 | 2.9.1 | 2.9.1 | Current. |
| type-check | 0.4.0 | 0.4.0 | 0.4.0 | Current. |
| type-fest | 4.41.0, 5.10.0 | 4.41.0, 5.10.0 | 5.10.0 | parse-json@8.3.0 requires ^4.39.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| typescript | 7.0.2 | 7.0.2 | 7.0.2 | Current. |
| ua-parser-js | 1.0.41 | 1.0.41 | 2.0.10 | fbjs@3.0.5 requires ^1.0.35. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| ufo | 1.6.4 | 1.6.4 | 1.6.4 | Current. |
| undici | 8.12.3 | 8.12.4 | 8.12.4 | Current. |
| undici-types | 8.9.0 | 8.9.0 | 8.12.4 | @types/node@26.6.6 requires ~8.9.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| unicorn-magic | 0.4.1 | 0.4.1 | 0.4.1 | Current. |
| unified | 11.0.5 | 11.0.5 | 11.0.5 | Current. |
| unist-util-is | 6.0.1 | 6.0.1 | 6.0.1 | Current. |
| unist-util-position-from-estree | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| unist-util-stringify-position | 4.0.0 | 4.0.0 | 4.0.0 | Current. |
| unist-util-visit | 5.1.0 | 5.2.0 | 5.2.0 | Current. |
| unist-util-visit-parents | 6.0.2 | 6.1.0 | 6.1.0 | Current. |
| unplugin | 3.7.0 | 3.7.0 | 3.7.0 | Current. |
| update-browserslist-db | 1.3.4 | 1.3.4 | 1.3.4 | Current. |
| uri-js | 4.4.1 | 4.4.1 | 4.4.1 | Current. |
| use-sync-external-store | 1.7.0 | 1.7.0 | 1.7.0 | Current. |
| validate-npm-package-license | 3.0.4 | 3.0.4 | 3.0.4 | Current. |
| verkit | 0.5.0 | 0.5.0 | 0.5.0 | Current. |
| version-range | 4.15.0 | 4.15.0 | 4.15.0 | Current. |
| vfile | 6.0.3 | 6.0.3 | 6.0.3 | Current. |
| vfile-message | 4.0.3 | 4.0.4 | 4.0.4 | Current. |
| vite | 8.3.6 | 8.3.8 | 8.3.8 | Current. |
| vitefu | 1.1.3 | 1.1.3 | 1.1.3 | Current. |
| vue | 3.5.45 | 3.5.45 | 3.5.45 | Current. |
| w3c-xmlserializer | 6.0.0 | 6.0.0 | 6.0.0 | Current. |
| webidl-conversions | 3.0.1, 8.0.1 | 3.0.1, 8.0.1 | 8.0.1 | whatwg-url@5.0.0 requires ^3.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| webpack-virtual-modules | 0.6.2 | 0.6.2 | 0.6.2 | Current. |
| whatwg-mimetype | 5.0.0 | 5.0.0 | 5.0.0 | Current. |
| whatwg-url | 5.0.0, 17.3.0 | 5.0.0, 17.3.0 | 17.3.0 | node-fetch@2.7.0 requires ^5.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| which | 2.0.2 | 2.0.2 | 7.0.0 | cross-spawn@7.0.6 requires ^2.0.1. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| word-wrap | 1.2.5 | 1.2.5 | 1.2.5 | Current. |
| wrap-ansi | 9.0.2 | 9.0.2 | 10.0.2 | cliui@9.0.1 requires ^9.0.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| xml-name-validator | 5.0.0 | 5.0.0 | 5.0.0 | Current. |
| xmlbuilder2 | 4.0.3 | 4.0.3 | 4.0.3 | Current. |
| xmlchars | 2.2.0 | 2.2.0 | 2.2.0 | Current. |
| y18n | 5.0.8 | 5.0.8 | 5.0.8 | Current. |
| yallist | 3.1.1 | 3.1.1 | 5.0.0 | lru-cache@5.1.1 requires ^3.0.2. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| yaml | 2.9.1 | 2.9.1 | 2.9.1 | Current. |
| yargs | 18.2.0 | 18.2.0 | 18.2.0 | Current. |
| yargs-parser | 22.0.0 | 22.0.0 | 22.0.0 | Current. |
| yocto-queue | 0.1.0 | 0.1.0 | 1.2.2 | p-limit@3.1.0 requires ^0.1.0. Parent release/compatibility constraint; forcing a different API or binary ABI via overrides is not a safe migration. |
| zod | 4.6.7 | 4.6.7 | 4.6.7 | Current. |
| zwitch | 2.0.4 | 2.0.4 | 2.0.4 | Current. |
