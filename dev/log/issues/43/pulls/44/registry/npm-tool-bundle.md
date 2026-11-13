Registry snapshot: 2026-11-13T22:32:46.290698+00:00. `Before` is main at 3da5027; `after` is this PR.

Complete separately audited official npm CLI tree: previous pinned recovery npm 11.21.0 versus current npm 12.2.2. This tree is outside the application lockfile. Its unresolved glob/minimatch advisories are not hidden by the clean application audit. Overrides were tested and do not repair bundled copies.

| Tool dependency | Before bundled | After bundled | Registry latest | Reason / blocker |
| --- | --- | --- | --- | --- |
| @gar/promise-retry | 1.0.3 | 1.0.3 | 1.0.3 | Current. |
| @isaacs/fs-minipass | 4.0.1 | 4.0.1 | 4.0.1 | Current. |
| @isaacs/string-locale-compare | 1.1.0 | 1.1.0 | 1.1.0 | Current. |
| @npmcli/agent | 4.0.2 | 5.0.2 | 5.0.2 | Current. |
| @npmcli/arborist | 9.9.2 | 10.0.4 | 10.0.4 | Current. |
| @npmcli/config | 10.14.0 | 11.2.0 | 11.2.0 | Current. |
| @npmcli/fs | 5.0.0 | 6.0.0 | 6.0.0 | Current. |
| @npmcli/git | 7.0.2 | 8.0.0 | 8.0.0 | Current. |
| @npmcli/installed-package-contents | 4.0.0 | 5.0.0 | 5.0.0 | Current. |
| @npmcli/map-workspaces | 5.0.3 | 6.0.0 | 6.0.0 | Current. |
| @npmcli/metavuln-calculator | 9.0.3 | 10.0.0 | 10.0.0 | Current. |
| @npmcli/name-from-folder | 4.0.0 | 5.0.0 | 5.0.0 | Current. |
| @npmcli/node-gyp | 5.0.0 | 6.0.0 | 6.0.0 | Current. |
| @npmcli/package-json | 7.0.5 | 8.0.0 | 8.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^8.0.0; @npmcli/arborist requires ^8.0.0; @npmcli/config requires ^8.0.0; @npmcli/map-workspaces requires ^8.0.0; @npmcli/run-script requires ^8.0.0; init-package-json requires ^8.0.0; libnpmexec requires ^8.0.0; libnpmpublish requires ^8.0.0; pacote requires ^8.0.0 |
| @npmcli/promise-spawn | 9.0.1 | 10.0.1 | 10.0.1 | Current. |
| @npmcli/query | 5.0.0 | 5.0.0 | 6.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. @npmcli/arborist requires ^5.0.0 |
| @npmcli/redact | 4.0.0 | 5.0.0 | 5.0.0 | Current. |
| @npmcli/run-script | 10.0.4 | 11.0.0 | 11.0.0 | Current. |
| @sigstore/bundle | 4.0.0 | 5.0.0 | 5.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. @sigstore/sign requires ^5.0.0; @sigstore/verify requires ^5.0.0; sigstore requires ^5.0.0 |
| @sigstore/core | 3.2.1 | 4.0.1 | 4.0.1 | Current. |
| @sigstore/protobuf-specs | 0.5.1 | 0.5.1 | 0.5.2 | Official npm bundle; consumer overrides do not replace bundled entries. @sigstore/bundle requires ^0.5.0; @sigstore/sign requires ^0.5.0; @sigstore/tuf requires ^0.5.0; @sigstore/verify requires ^0.5.0; sigstore requires ^0.5.0 |
| @sigstore/sign | 4.1.1 | 5.0.0 | 5.1.0 | Official npm bundle; consumer overrides do not replace bundled entries. sigstore requires ^5.0.0 |
| @sigstore/tuf | 4.0.2 | 5.0.0 | 5.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^5.0.0; sigstore requires ^5.0.0 |
| @sigstore/verify | 3.1.1 | 4.1.0 | 4.1.3 | Official npm bundle; consumer overrides do not replace bundled entries. sigstore requires ^4.0.0 |
| @tufjs/canonical-json | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| @tufjs/models | 4.1.0 | 5.0.0 | 5.0.2 | Official npm bundle; consumer overrides do not replace bundled entries. tuf-js requires 5.0.0 |
| abbrev | 4.0.0 | 5.0.0 | 5.0.0 | Current. |
| agent-base | 7.1.4 | 9.0.0 | 9.0.0 | Current. |
| aproba | 2.1.0 | 2.1.0 | 2.1.0 | Current. |
| archy | 1.0.0 | 1.0.0 | 1.0.0 | Current. |
| balanced-match | 4.0.4 | 4.0.4 | 5.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. brace-expansion requires ^4.0.2 |
| bin-links | 6.0.2 | 7.0.1 | 7.0.1 | Current. |
| binary-extensions | 3.1.0 | 3.1.0 | 3.2.0 | Official npm bundle; consumer overrides do not replace bundled entries. libnpmdiff requires ^3.0.0 |
| brace-expansion | 5.0.9 | 5.0.12 | 5.0.13 | Official npm bundle; consumer overrides do not replace bundled entries. minimatch requires ^5.0.5 |
| cacache | 20.0.4 | 21.0.1 | 21.0.2 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^21.0.1; @npmcli/arborist requires ^21.0.1; @npmcli/metavuln-calculator requires ^21.0.1; make-fetch-happen requires ^21.0.0; pacote requires ^21.0.1 |
| chalk | 5.6.2 | 5.6.2 | 6.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^5.6.2 |
| chownr | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| ci-info | 4.4.0 | 4.4.0 | 4.5.0 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^4.4.0; @npmcli/config requires ^4.0.0; libnpmexec requires ^4.0.0; libnpmpublish requires ^4.0.0 |
| cidr-regex | 5.0.5 | 6.0.0 | 7.1.2 | Official npm bundle; consumer overrides do not replace bundled entries. is-cidr requires ^6.0.0 |
| cmd-shim | 8.0.0 | 9.0.2 | 9.0.2 | Current. |
| common-ancestor-path | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| cssesc | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| debug | 4.4.3 | 4.4.3 | 4.4.3 | Current. |
| diff | 8.0.4 | 8.0.4 | 9.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^8.0.2; @npmcli/arborist requires ^8.0.2; libnpmdiff requires ^8.0.2 |
| env-paths | 2.2.1 | 2.2.1 | 4.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. node-gyp requires ^2.2.0 |
| exponential-backoff | 3.1.3 | 3.1.3 | 3.1.3 | Current. |
| fastest-levenshtein | 1.0.16 | 1.0.16 | 1.0.16 | Current. |
| fdir | 6.5.0 | 6.5.0 | 6.5.0 | Current. |
| fs-minipass | 3.0.3 | 3.0.3 | 3.0.3 | Current. |
| glob | 13.0.6 | 13.0.6 | 14.0.6 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^13.0.6; @npmcli/map-workspaces requires ^13.0.0; @npmcli/package-json requires ^13.0.0; cacache requires ^13.0.0; npm-packlist requires ^13.0.6 BLOCKED: published advisory; upstream npm/cli#10299. See ANALYSIS.md. |
| graceful-fs | 4.2.11 | 4.2.11 | 4.2.12 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^4.2.11; node-gyp requires ^4.2.6 |
| hosted-git-info | 9.0.3 | 10.1.1 | 10.1.1 | Current. |
| http-cache-semantics | 4.2.0 | 4.3.0 | 4.3.0 | Current. |
| http-proxy-agent | 7.0.2 | 9.1.0 | 9.1.0 | Current. |
| https-proxy-agent | 7.0.6 | 9.1.0 | 9.1.0 | Current. |
| iconv-lite | 0.7.2 | 0.7.3 | 0.7.3 | Current. |
| ignore-walk | 8.0.0 | 9.0.0 | 9.0.0 | Current. |
| ini | 6.0.0 | 7.0.0 | 7.0.0 | Current. |
| init-package-json | 8.2.5 | 9.0.0 | 9.0.0 | Current. |
| ip-address | 10.5.0 | 10.7.5 | 10.7.6 | Official npm bundle; consumer overrides do not replace bundled entries. socks requires ^10.1.1 |
| is-cidr | 6.0.4 | 7.0.0 | 7.0.3 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^7.0.0 |
| isexe | 4.0.0 | 4.0.0 | 4.0.0 | Current. |
| json-parse-even-better-errors | 5.0.0 | 6.0.0 | 6.0.0 | Current. |
| json-stringify-nice | 1.1.4 | 1.1.4 | 1.1.4 | Current. |
| jsonparse | 1.3.1 | 1.3.1 | 1.3.1 | Current. |
| just-diff | 6.0.2 | 6.0.2 | 6.0.2 | Current. |
| just-diff-apply | 5.5.0 | 5.5.0 | 5.5.0 | Current. |
| libnpmaccess | 10.0.3 | 11.0.0 | 11.0.0 | Current. |
| libnpmdiff | 8.1.13 | 9.0.4 | 9.0.4 | Current. |
| libnpmexec | 10.3.3 | 11.0.5 | 11.0.5 | Current. |
| libnpmfund | 7.0.27 | 8.0.4 | 8.0.4 | Current. |
| libnpmorg | 8.0.1 | 9.0.0 | 9.0.0 | Current. |
| libnpmpack | 9.1.14 | 10.0.4 | 10.0.4 | Current. |
| libnpmpublish | 11.2.1 | 12.0.1 | 12.0.1 | Current. |
| libnpmsearch | 9.0.1 | 10.0.0 | 10.0.0 | Current. |
| libnpmteam | 8.0.2 | 9.0.0 | 9.0.0 | Current. |
| libnpmversion | 8.0.4 | 9.0.0 | 9.0.0 | Current. |
| lru-cache | 11.5.1 | 11.5.2 | 11.5.3 | Official npm bundle; consumer overrides do not replace bundled entries. @npmcli/agent requires ^11.2.1; @npmcli/arborist requires ^11.2.1; @npmcli/git requires ^11.2.1; cacache requires ^11.1.0; hosted-git-info requires ^11.1.0; path-scurry requires ^11.0.0 |
| make-fetch-happen | 15.0.6 | 16.0.1 | 16.0.1 | Current. |
| minimatch | 10.2.5 | 10.2.5 | 11.0.8 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^10.2.5; @npmcli/arborist requires ^10.0.3; @npmcli/map-workspaces requires ^10.0.3; @tufjs/models requires ^10.2.1; glob requires ^10.2.2; libnpmdiff requires ^10.0.3; ignore-walk requires ^10.0.3 BLOCKED: published advisory; upstream npm/cli#10299. See ANALYSIS.md. |
| minipass | 3.3.6, 7.1.3 | 3.3.6, 7.1.3 | 7.1.3 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^7.1.3; @isaacs/fs-minipass requires ^7.0.4; cacache requires ^7.0.3; fs-minipass requires ^7.0.3; glob requires ^7.1.3; make-fetch-happen requires ^7.0.2; minipass-collect requires ^7.0.3; minipass-fetch requires ^7.0.3; minipass-flush requires ^7.1.3; minipass-pipeline requires ^3.0.0; minipass-sized requires ^7.1.2; minizlib requires ^7.1.2; npm-registry-fetch requires ^7.0.2; pacote requires ^7.0.2; path-scurry requires ^7.1.2; ssri requires ^7.0.3; tar requires ^7.1.2 |
| minipass-collect | 2.0.1 | 2.0.1 | 2.0.1 | Current. |
| minipass-fetch | 5.0.2 | 6.0.0 | 6.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. make-fetch-happen requires ^6.0.0; npm-registry-fetch requires ^6.0.0 |
| minipass-flush | 1.0.6 | 1.0.6 | 2.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. cacache requires ^1.0.5; make-fetch-happen requires ^1.0.5 |
| minipass-pipeline | 1.2.4 | 1.2.4 | 3.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^1.2.4; cacache requires ^1.2.4; make-fetch-happen requires ^1.2.4 |
| minipass-sized | 2.0.0 | 2.0.0 | 2.0.0 | Current. |
| minizlib | 3.1.0 | 3.1.0 | 3.1.0 | Current. |
| ms | 2.1.3 | 2.1.3 | 2.1.3 | Current. |
| mute-stream | 3.0.0 | 4.0.0 | 4.0.0 | Current. |
| negotiator | 1.0.0 | 1.0.0 | 1.1.0 | Official npm bundle; consumer overrides do not replace bundled entries. make-fetch-happen requires ^1.0.0 |
| node-gyp | 12.4.0 | 13.0.0 | 13.1.0 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^13.0.0; @npmcli/run-script requires ^13.0.0 |
| nopt | 9.0.0 | 10.0.1 | 10.0.1 | Current. |
| npm | 11.21.0 | 12.2.2 | 12.2.2 | Current. |
| npm-audit-report | 7.0.0 | 8.0.0 | 8.0.0 | Current. |
| npm-bundled | 5.0.0 | 6.0.0 | 6.0.0 | Current. |
| npm-install-checks | 8.0.0 | 9.0.0 | 9.0.0 | Current. |
| npm-normalize-package-bin | 5.0.0 | 6.0.0 | 6.0.0 | Current. |
| npm-package-arg | 13.0.2 | 14.0.0 | 14.0.0 | Current. |
| npm-packlist | 10.0.4 | 11.3.0 | 11.3.1 | Official npm bundle; consumer overrides do not replace bundled entries. pacote requires ^11.2.0 |
| npm-pick-manifest | 11.0.3 | 12.0.0 | 12.0.0 | Current. |
| npm-profile | 12.0.2 | 13.0.1 | 13.0.1 | Current. |
| npm-registry-fetch | 19.1.1 | 20.0.1 | 20.0.1 | Current. |
| npm-user-validate | 4.0.0 | 5.0.0 | 5.0.0 | Current. |
| p-map | 7.0.4 | 7.0.5 | 7.1.1 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^7.0.4; cacache requires ^7.0.2 |
| pacote | 21.5.1 | 22.0.1 | 22.0.1 | Current. |
| parse-conflict-json | 5.0.1 | 6.0.0 | 6.0.0 | Current. |
| path-scurry | 2.0.2 | 2.0.2 | 3.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. glob requires ^2.0.2 |
| picomatch | 4.0.4 | 4.0.5 | 4.0.7 | Official npm bundle; consumer overrides do not replace bundled entries. tinyglobby requires ^4.0.4 |
| postcss-selector-parser | 7.1.4 | 7.1.6 | 7.2.1 | Official npm bundle; consumer overrides do not replace bundled entries. @npmcli/query requires ^7.0.0 |
| proc-log | 6.1.0 | 7.0.0 | 7.0.0 | Current. |
| proggy | 4.0.0 | 4.0.0 | 5.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. @npmcli/arborist requires ^4.0.0 |
| promise-all-reject-late | 1.0.1 | 1.0.1 | 1.0.1 | Current. |
| promise-call-limit | 3.0.2 | 3.0.2 | 3.0.2 | Current. |
| promzard | 3.0.1 | 4.0.0 | 4.0.0 | Current. |
| proxy-agent-negotiate | — | 1.1.0 | 1.1.0 | Current. |
| qrcode-terminal | 0.12.0 | 0.12.0 | 0.12.0 | Current. |
| read | 5.0.1 | 6.0.0 | 6.0.0 | Current. |
| read-cmd-shim | 6.0.0 | 7.0.0 | 7.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. bin-links requires ^7.0.0 |
| safer-buffer | 2.1.2 | 2.1.2 | 2.1.2 | Current. |
| semver | 7.8.5 | 7.8.6 | 7.8.6 | Current. |
| signal-exit | 4.1.0 | 4.1.0 | 4.1.0 | Current. |
| sigstore | 4.1.1 | 5.0.0 | 5.0.1 | Official npm bundle; consumer overrides do not replace bundled entries. libnpmpublish requires ^5.0.0; pacote requires ^5.0.0 |
| smart-buffer | 4.2.0 | 4.2.0 | 4.2.0 | Current. |
| socks | 2.8.9 | 2.8.9 | 2.8.10 | Official npm bundle; consumer overrides do not replace bundled entries. socks-proxy-agent requires ^2.8.3 |
| socks-proxy-agent | 8.0.5 | 10.1.0 | 10.1.0 | Current. |
| spdx-exceptions | 2.5.0 | 2.5.0 | 2.5.0 | Current. |
| spdx-expression-parse | 4.0.0 | 4.0.0 | 5.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^4.0.0; @npmcli/package-json requires ^4.0.0 |
| spdx-license-ids | 3.0.23 | 3.0.23 | 3.0.24 | Official npm bundle; consumer overrides do not replace bundled entries. spdx-expression-parse requires ^3.0.0 |
| ssri | 13.0.1 | 14.0.0 | 14.0.0 | Current. |
| supports-color | 10.2.2 | 10.2.2 | 11.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^10.2.2 |
| tar | 7.5.22 | 7.5.22 | 7.5.23 | Official npm bundle; consumer overrides do not replace bundled entries. npm requires ^7.5.22; libnpmdiff requires ^7.5.1; node-gyp requires ^7.5.4; pacote requires ^7.4.3 |
| text-table | 0.2.0 | 0.2.0 | 0.2.0 | Current. |
| tiny-relative-date | 2.0.2 | 2.0.2 | 2.0.2 | Current. |
| tinyglobby | 0.2.17 | 0.2.17 | 0.2.17 | Current. |
| treeverse | 3.0.0 | 3.0.0 | 3.0.0 | Current. |
| tuf-js | 4.1.0 | 6.0.0 | 6.0.2 | Official npm bundle; consumer overrides do not replace bundled entries. @sigstore/tuf requires ^6.0.0 |
| undici | 6.28.0 | 6.29.1 | 8.12.4 | Official npm bundle; consumer overrides do not replace bundled entries. node-gyp requires ^6.25.0 |
| util-deprecate | 1.0.2 | 1.0.2 | 1.0.2 | Current. |
| validate-npm-package-name | 7.0.2 | 8.0.0 | 8.0.0 | Current. |
| walk-up-path | 4.0.0 | 4.0.0 | 4.0.0 | Current. |
| which | 6.0.1 | 7.0.0 | 7.0.0 | Current. |
| write-file-atomic | 7.0.1 | 8.0.0 | 8.0.0 | Current. |
| yallist | 4.0.0, 5.0.0 | 4.0.0, 5.0.0 | 5.0.0 | Official npm bundle; consumer overrides do not replace bundled entries. tar requires ^5.0.0 |
