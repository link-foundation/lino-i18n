# JS Links Notation dependency migration notes (issue #26 / PR #27)

Researched on 2026-10-08. Scope: `js/package.json` runtime dependencies
`links-notation` (^0.13.0 -> 0.23.0), `lino-objects-codec` (^0.4.0 -> 0.9.0),
`lino-arguments` (^0.3.0, latest) and its optional peer `@dotenvx/dotenvx`,
plus the honest `engines.node` floor.

## TL;DR

1. **`links-notation` and `lino-objects-codec` are not imported anywhere in
   `js/src`, `js/bin`, `js/scripts`, `js/tests` or `js/examples`.** They are
   dead runtime dependencies left over from v0.0.1. The last import
   (`import { formatIndented, parseIndented } from 'lino-objects-codec'`) was
   removed by commit `d32cd24` ("feat: add nested lino catalogue authoring"),
   which replaced it with the hand-rolled parser in `js/src/catalogs.js`.
   `links-notation` was never imported directly.
2. **No upstream API can replace `js/src/catalogs.js` without changing the
   catalogue format.** The `.lino` catalogue dialect lino-i18n accepts is not
   standard Links Notation (backslash escapes, raw rest-of-line values,
   dedented triple-quoted blocks). Experiments below show `parseIndented`
   throws on the repo's own `locales/en.lino` (old and new), `decode` flattens
   it into an array, and `Parser.parse` mangles escapes / whitespace.
3. **`lino-arguments` is used only by four release scripts** in `js/scripts/`
   (dev tooling), never by the published runtime. `bin/lino-i18n.js` merely
   claims it in a comment. It belongs in `devDependencies`.
4. **`@dotenvx/dotenvx` is not installed at all.** It is an *optional peer*
   (`^1.0.0`) of `lino-arguments@0.3.0`; `npm outdated --all` reports it as
   `MISSING 1.75.1 -> 2.33.0` only because "wanted" is computed from the peer
   range. lino-i18n scripts never enable `.env` loading, so it is never
   imported. Upstream already merged the bump to `^2.33.0` (lino-arguments
   PR #38, 2026-10-07) but the npm release (expected 0.4.0) **failed** and was
   never published. `lino-arguments@0.3.0` is the latest on npm.
5. `engines.node: ">=20.0.0"` is not honest: Node 20 is EOL (2026-04-30), CI
   runs only Node `24.x`, and `lino-objects-codec@0.9.0` itself declares
   `>=22.11.0`. Recommended: `">=22"` **with** a Node 22 leg in the CI test
   matrix, or `">=24"` if only Node 24 stays tested.

## 1. Usage inventory in lino-i18n

Command:

```bash
grep -rn "links-notation\|lino-objects-codec\|lino-arguments" js \
  --include=*.js --include=*.mjs --include=*.ts --include=*.cjs --exclude-dir=node_modules
```

| File | Line | Kind | Symbol |
| --- | --- | --- | --- |
| `js/scripts/instant-version-bump.mjs` | 31 | import | `makeConfig` from `lino-arguments` |
| `js/scripts/create-manual-changeset.mjs` | 18 | import | `makeConfig` from `lino-arguments` |
| `js/scripts/format-release-notes.mjs` | 29 | import | `makeConfig` from `lino-arguments` |
| `js/scripts/format-github-release.mjs` | 15 | import | `makeConfig` from `lino-arguments` |
| `js/src/index.js` | 3-4 | comment only | "parsed through `lino-objects-codec`" (stale) |
| `js/bin/lino-i18n.js` | 5-7 | comment only | "Built on top of `lino-arguments` ... CLI flags > environment variables > config file > defaults" (stale: `parseFlags`/`withConfig` at lines 79-125 are hand-rolled, no env vars are read) |

All four scripts call `makeConfig({ yargs: ({ yargs, getenv }) => yargs.option(...) })`
with default `lenv`/`env`/`getenv` options, i.e. `.env` (dotenvx) loading is
**disabled** (`env.enabled` defaults to `false` in
`node_modules/lino-arguments/src/index.js:318`).

History: `git log -S"from 'lino-objects-codec'" --oneline` -> `d32cd24`
(removed) and `41c514e` (added, v0.0.1). `git log -S"from 'links-notation'"`
-> no commits. Rationale for the hand-rolled parser is in
`docs/case-studies/issue-3/README.md:43-48` ("The JavaScript loader previously
delegated catalogue parsing to `lino-objects-codec.parseIndented` and then
treated only direct key/value entries as translations").

Runtime import graph (`grep -rn "^import" js/src js/bin`): only `node:fs`,
`node:path`, `node:url`, `react` (optional peer) and relative modules.
`js/src/browser.js:1` explicitly documents "its entire import graph uses only
platform APIs".

`npm ls` (repo, before):

```
lino-i18n@0.3.0
+-- links-notation@0.13.0
+-- lino-arguments@0.3.0
| +-- links-notation@0.11.2
| `-- lino-env@0.2.8
|   `-- links-notation@0.11.2
`-- lino-objects-codec@0.4.0
  `-- links-notation@0.11.2
```

Side note for the Rust researcher: `rust/lino-i18n/Cargo.toml:23` and
`rust/lino-i18n-macros/Cargo.toml:25` declare `lino-objects-codec = "0.2.1"`
but `grep -rn lino_objects_codec rust --include=*.rs` returns 0 hits - the
same dead-dependency situation exists in Rust (latest crate 0.8.0).

## 2. Upstream changes

### Sources / commands

```bash
gh api repos/link-foundation/links-notation/contents/CHANGELOG.md --jq .content | base64 -d
gh api repos/link-foundation/lino-objects-codec/contents/js/CHANGELOG.md --jq .content | base64 -d
gh api repos/link-foundation/lino-arguments/contents/js/CHANGELOG.md --jq .content | base64 -d
gh release list --repo link-foundation/links-notation --limit 200   # js_0.15.0 .. js_0.23.0, bodies only contain the npm URL
gh api repos/link-foundation/links-notation/compare/js_0.13.0...js_0.23.0   # 471 commits
npm view <pkg>@<ver> --json
# scratch installs (outside the repo)
/tmp/research-js/old: npm install links-notation@0.13.0 lino-objects-codec@0.4.0 lino-arguments@0.3.0
/tmp/research-js/new: npm install links-notation@0.23.0 lino-objects-codec@0.9.0 lino-arguments@0.3.0
```

### Package metadata

| Package@ver | engines.node | deps | types | exports |
| --- | --- | --- | --- | --- |
| links-notation@0.13.0 | (none) | none | none | `main: dist/index.js` |
| links-notation@0.23.0 | (none) | none | `index.d.ts` (new) | `main: dist/index.js` (dist 60 KB -> 104 KB) |
| lino-objects-codec@0.4.0 | `>=18.0.0` | `links-notation ^0.11.0` | none | `.` |
| lino-objects-codec@0.9.0 | **`>=22.11.0`** | `links-notation ^0.23.0` | none | `.` |
| lino-arguments@0.3.0 (latest npm) | `>=20.0.0` | getenv ^2, links-notation ^0.11.2, lino-env ^0.2.6, yargs ^17.7.2; optional peer `@dotenvx/dotenvx ^1.0.0` | none | `.` |

Exported symbols:

- links-notation 0.13.0: `FormatConfig, FormatOptions, Link, LinksGroup, Parser, formatLinks`.
- links-notation 0.23.0 adds: `ArityRange, BinaryLinoCodec, BinaryLinoOptions, DEFAULT_MAX_DEPTH, DecodeLimits, External, LinksPacket, PacketReader, ParseError, Section, StreamParseError, StreamParser, formatBinaryDocument, formatBinaryReference, stripComments`. `Parser` now takes `{ maxInputSize, maxDepth, comments }`.
- lino-objects-codec 0.4.0: `ObjectCodec, decode, encode, escapeReference, unescapeReference, formatIndented, parseIndented, formatAsLino, jsonToLino, linoToJson, extractKeywords, findAllMatches, findBestMatch, keywordSimilarity, levenshteinDistance, normalizeQuestion, stringSimilarity`.
- lino-objects-codec 0.9.0 adds: `BASE64_MARKER, CircularReferenceError, DEBUG_ENV_VAR, DEFAULT_INDENT, ESCAPED_MARKER, OBJECT_MARKER, decodeCompact, decodeLine, encodeCompact, encodeLine, encodeObfuscated, formatValueSingleLine, formatValueVerbatim, isCompactNotation, isDebugEnabled, setDebugEnabled`.

### lino-objects-codec 0.4.0 -> 0.9.0 (from `js/CHANGELOG.md`)

- 0.5.0: "Make the readable indented Links Notation the default `encode`/`decode`
  output" (breaking for anyone persisting `encode()` output; old base64 form was
  the default before).
- 0.6.0: "Add `encodeLine` and `decodeLine`" ... "`OBJECT_MARKER` (`o`)".
- 0.7.0: "`encode` and `encodeLine` never reach for base64 ... `(escaped "line
  one%0Aline two")`"; "A string containing the quote delimiter is written
  between a run of at least three of them".
- 0.8.0: "`links-notation` `^0.11.0` -> `^0.16.1`" and "**`engines.node` moves
  from `>=18.0.0` to `>=22.11.0`**".
- 0.9.0: "Expose single-line and verbatim value formatters ... Update
  links-notation to 0.23.0".

`parseIndented` / `formatIndented` (the only functions lino-i18n ever used) have
no changelog entries after 0.4.0 and behave identically in the experiments.

### links-notation 0.13.0 -> 0.23.0 (root `CHANGELOG.md`, `[Unreleased]` section; GitHub JS release bodies are empty)

Behaviour changes relevant to any `.lino` consumer:

- Comments: "a `#` written where a reference could begin hides the rest of the
  line ... Comments are on by default and can be switched off ...
  `new Parser({ comments: false })` in JavaScript" (#301).
- Nesting limit: "The default nesting limit is 64 in every implementation,
  down from the documented 1000 that was never enforced" (#315); deeper input
  throws `ParseError: Nesting too deep ...`.
- `ParseError` exported, "thrown by `Parser.parse` when a document does not
  parse. It carries `offset`, `line`, `column` ..." (#302).
- "Parentheses open a nested context in every implementation" (#282); "Blank
  lines inside a block are skipped instead of ending it".
- Empty reference: commit `1d87b03 fix(js): read a bare delimiter pair as the empty reference`.
- "Preserve names and nested values below indented IDs" (#313); linear-time
  parsing fixes (#314, #316); streaming parser (#197); TypeScript definitions
  (commit `8f06de5`).

## 3. Experiments (scratch dir `/tmp/research-js/experiments`)

Scripts: `/tmp/research-js/experiments/compare.mjs` and `edge.mjs`, run as
`node compare.mjs /tmp/research-js/{old,new}/node_modules js/locales/en.lino`.

### 3.1 Can upstream parse lino-i18n's own catalogue (`js/locales/en.lino`)?

| API | 0.13.0 / 0.4.0 | 0.23.0 / 0.9.0 |
| --- | --- | --- |
| `parseIndented({ text })` | **throws** `Unterminated quoted reference: description """` | **throws** (same) |
| `decode({ notation: text })` | throws `Unknown type marker: en` | returns a **flat array** `["en","greeting","Hello, {{name}}!","farewell",...]` - nesting lost |
| `new Parser().parse(text)` | nested links, triple-quoted values keep raw indentation (`'\n      Keep each ...\n    '`) | same |

### 3.2 links-notation edge cases (old -> new)

| Input | 0.13.0 | 0.23.0 |
| --- | --- | --- |
| `issue Fix issue #5 now` | `(issue Fix issue #5 now)` | `(issue Fix issue)` - **truncated by comment** (ok with `{ comments: false }`) |
| `# header comment` line | `(# header comment)` link | dropped |
| `empty ""` | `'""'` literal | empty reference `""` |
| 70-level indentation | parses | **`ParseError` nesting depth exceeds 64** |
| `(a b)` value, blank line in block, `en:` | unchanged | unchanged |

### 3.3 lino-i18n dialect vs Links Notation (new Parser, `comments:false`)

Input:

```
en
  a Hello   spaced  world
  b "line\none"
  c "say \"hi\""
  d it's fine
```

- lino-i18n `parseLinoCatalogs`: `{"a":"Hello   spaced  world","b":"line\none" (real newline),"c":"say \"hi\"","d":"it's fine"}`
- links-notation: `(a Hello spaced world)` (whitespace runs collapsed into 3
  references), `(b line\none)` (no escape processing), `(c 'say \' 'hi\""')`
  (backslash-quote splits the reference), `(d "it's" fine)`.

`js/tests/i18n.test.js:60,81` pins `path "C:\\new"` -> `C:\new`, i.e. backslash
escapes are part of lino-i18n's public format contract.

### 3.4 Formatter / escaper output (relevant only if formatting were delegated)

- `formatIndented({ id:'en', obj })` (both versions): splits nested objects
  into separate `en_cart:` blocks with generated ids and single quotes -
  incompatible with lino-i18n's nested output (`catalogs.js:389-417`).
- `encode({ obj })` 0.9.0: readable parenthesised form `(\n  en (\n    greeting "Hello, {{name}}!" ...`; 0.4.0: base64 `(object ((str ZW4=) ...`.
- `escapeReference` unchanged between versions (`'has space'`, `"it's"`, raw
  newline kept inside quotes, backslash untouched).
- New 0.9.0 `formatValueSingleLine('a\nb')` -> `(escaped "a%0Ab")`;
  `formatValueVerbatim('a\nb')` -> `"a\nb"` (raw newline). Neither matches
  lino-i18n's `escapeValue` (`catalogs.js:50-60`, backslash escapes) or the
  `"""` block form (`catalogs.js:389-396`).

### 3.5 Replacement candidates (file:line -> upstream) - verdict

| lino-i18n code | Upstream candidate | Verdict |
| --- | --- | --- |
| `js/src/catalogs.js:23-48` `unescapeValue` | `unescapeReference` (lino-objects-codec) | No: LN has no backslash escapes; behaviour differs and tests pin it. |
| `js/src/catalogs.js:50-60` `escapeValue` | `escapeReference`, `formatValueSingleLine`, `formatValueVerbatim` | No: different quoting/escaping contract. |
| `js/src/catalogs.js:62-214` line tokenizer, quoted/triple-quoted values | `links-notation` `Parser` (+ `{ comments:false }`) | No without a format break: whitespace collapse, no escapes, no dedent of `"""` blocks, 64-depth cap, +104 KB to the browser bundle that `browser.js:1` promises is platform-only. |
| `js/src/catalogs.js:216-272` tree builder | `parseIndented` / `decode` | No: `parseIndented` throws on `"""`; `decode` flattens to an array. |
| `js/src/catalogs.js:389-470` formatter | `formatIndented` / `encode` | No: different output layout (generated `en_cart` ids / parenthesised form). |
| `js/bin/lino-i18n.js:79-125` `parseFlags`/`withConfig` | `lino-arguments` `makeConfig` | Possible but not recommended now: would make yargs 17 + links-notation 0.11 runtime deps of the CLI and change `--config` (JSON) semantics; lino-arguments 0.3.0 itself is stale (see section 4). |

Conclusion: the hand-rolled parser is a deliberate, tested dialect; no
upstream feature in links-notation 0.23.0 / lino-objects-codec 0.9.0 replaces
it 1:1. The honest migration is to **drop the unused dependencies**, not to
bump them.

## 4. lino-arguments and `@dotenvx/dotenvx`

- `npm view lino-arguments time`: `0.2.1` 2025-11-15, `0.2.5` 2025-12-09,
  `0.3.0` 2026-04-10 -> **0.3.0 is the latest on npm**.
- `@dotenvx/dotenvx` is only an **optional** peer: `"peerDependencies":
  {"@dotenvx/dotenvx": "^1.0.0"}, "peerDependenciesMeta": {"@dotenvx/dotenvx":
  {"optional": true}}` (`js/package-lock.json:3355-3362`). npm does not
  install optional peers, so the lockfile contains no `node_modules/@dotenvx`
  entry; `npm ls` in the scratch dir prints `UNMET OPTIONAL DEPENDENCY
  @dotenvx/dotenvx@^1.0.0`. The line
  `@dotenvx/dotenvx MISSING 1.75.1 2.33.0 - lino-arguments` in
  `registry/npm-outdated-all-before.txt:7` is therefore "wanted per peer
  range", not something resolved or shipped. It is imported lazily
  (`await import('@dotenvx/dotenvx')`, `lino-arguments/src/index.js:251`) only
  when `makeConfig({ env: { enabled: true } })`; no lino-i18n script does that.
- Upstream fix exists but is **unreleased**: lino-arguments PR #38
  (https://github.com/link-foundation/lino-arguments/pull/38, merged
  2026-10-07T02:57Z) bumps `js/package.json` to links-notation ^0.23.0,
  yargs ^18.2.0, peer `@dotenvx/dotenvx ^2.33.0`, engines
  `^20.19.0 || ^22.12.0 || >=23`, and says "Expected next versions are Rust
  0.3.1 and npm 0.4.0". The post-merge JavaScript release run
  https://github.com/link-foundation/lino-arguments/actions/runs/37564452408
  failed in the `Release` job:
  `scripts/rust-paths.mjs:82 ... Error: Could not find Cargo.toml in expected locations.`
  so npm still serves 0.3.0. Open upstream issue #40 ("Update pinned
  yargs/links-notation and auto-map options to env vars") tracks the stale
  pins; there is no issue for the failed JS release yet - worth reporting
  upstream.
- Within lino-i18n, `lino-arguments` is a release-tooling dependency only
  (four `js/scripts/*.mjs`), executed in CI after `npm ci` (dev deps are
  installed: `.github/workflows/js.yml` uses plain `npm ci` everywhere).

## 5. engines.node floor

`npm view <pkg> engines` at latest versions:

| Package (latest) | engines.node |
| --- | --- |
| @changesets/cli 3.0.3 | `^22.11 \|\| ^24 \|\| >=26` (npm >=10.9.0) |
| @eslint/js 10.0.1 | `^20.19.0 \|\| ^22.13.0 \|\| >=24` |
| @playwright/test 1.64.0 | `>=20` |
| @secretlint/secretlint-rule-preset-recommend 13.0.7 | `>=22.0.0` |
| @testing-library/react 16.3.3 | `>=18` |
| @types/node 26.6.4, @types/react 19.3.0, eslint-config-prettier 10.1.8 | none |
| esbuild 0.28.2 | `>=18` |
| eslint 10.12.0 | `^20.19.0 \|\| ^22.13.0 \|\| >=24` |
| eslint-plugin-prettier 5.5.6 | `^14.18.0 \|\| >=16.0.0` |
| jscpd 5.4.0 | `>=18` |
| **jsdom 30.1.2** | **`^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`** (strictest) |
| prettier 3.9.9 | `>=14` |
| react 19.3.0 | `>=0.10.0` |
| secretlint 13.0.7 | `>=22.0.0` |
| test-anywhere 0.9.1 | `>=20.0.0` |
| typescript 7.0.2 | `>=16.20.0` |
| links-notation 0.23.0 | none |
| lino-objects-codec 0.9.0 | `>=22.11.0` |
| lino-arguments 0.3.0 | `>=20.0.0` |
| yargs 18.2.0 (upstream lino-arguments main) | `^20.19.0 \|\| ^22.12.0 \|\| >=23` |

Facts: CI uses `NODE_VERSION: 24.x` (`.github/workflows/js.yml:53`) for every
Node job; README.md:273-274 claims "the package's supported runtime range
remains Node 20 or newer" - untested and EOL. Node schedule
(`registry/node-release-schedule.txt`): v20 end 2026-04-30, v22 end
2027-04-30, v24 end 2028-04-30, v26 LTS 2026-10-28.

The published runtime has (after removing dead deps) no npm dependencies and
uses only `node:fs/promises`, `node:path`, `node:url`, so its true floor is
governed by what CI tests. Dev tooling needs Node >=22.22.2 (jsdom) to run the
test suite at all on 22.

Recommendation: `"engines": { "node": ">=22" }` and add `22.x` (plus
optionally `26.x`) to the Node leg of the test matrix in
`.github/workflows/js.yml` (tests run fine there since 22.x resolves to
>=22.22.2). If the matrix stays Node-24-only, the honest floor is `">=24"`.
Update README.md:273-274 and the root `README.md` text accordingly. If
`lino-objects-codec@0.9.0` were kept as a runtime dependency anyway, `>=22.11`
would be the minimum regardless (its own engines field).

## 6. Recommended concrete changes

1. `js/package.json`
   - Remove `"links-notation": "^0.13.0"` and `"lino-objects-codec": "^0.4.0"`
     from `dependencies` (unused since `d32cd24`). Keep the `links-notation`
     keyword.
   - Move `"lino-arguments": "^0.3.0"` from `dependencies` to
     `devDependencies` (used only by `js/scripts/*.mjs`). `dependencies`
     becomes empty / removed, so `npm i lino-i18n` installs nothing extra
     (today it pulls links-notation x2, lino-env, yargs 17, getenv, cliui ...).
   - `engines.node`: `">=22"` (with a Node 22 CI leg) or `">=24"`.
   - Regenerate `js/package-lock.json` (`npm install`), verify `npm ls`,
     `npm outdated` and `npm pack --dry-run` (no change in files).
2. `js/src/index.js:3-4`: fix the stale comment - catalogues are parsed by
   lino-i18n's own Links Notation dialect parser in `./catalogs.js`, not by
   `lino-objects-codec`.
3. `js/bin/lino-i18n.js:5-7`: fix the stale comment - the CLI uses its own
   flag parser (`parseFlags`) and optional JSON `--config` (`withConfig`);
   no `lino-arguments`, no environment variables.
4. `README.md:273-274`: replace "remains Node 20 or newer" with the new floor.
5. Add a changeset (patch or minor) noting: dropped unused runtime
   dependencies; Node floor raised (Node 20 EOL) - the engines bump is the
   user-visible part.
6. Optional regression guard: a test in `js/tests/package-metadata.test.js`
   asserting every name in `package.json#dependencies` is imported somewhere
   under `src/` or `bin/` (prevents re-accumulating dead runtime deps).
7. Record the `lino-arguments` / dotenvx status as a documented exception in
   the PR: npm latest is 0.3.0; the dotenvx 2.x peer and yargs 18 /
   links-notation 0.23 bumps are merged upstream (PR #38) but unpublished
   because release run 37564452408 failed (`Could not find Cargo.toml`).
   Consider filing an upstream issue for the failed JS release; once
   lino-arguments 0.4.0 is published, bump the devDependency.
8. (Rust, for the other researcher) `lino-objects-codec = "0.2.1"` in both
   `rust/lino-i18n/Cargo.toml:23` and `rust/lino-i18n-macros/Cargo.toml:25`
   is unused by any `.rs` file - same removal applies.

If maintainers nevertheless want to keep the two Lino packages as
dependencies (e.g. for "stack alignment"), the bump itself is mechanical (no
lino-i18n code imports them) but `lino-objects-codec@0.9.0` forces
`engines.node >=22.11.0` and adds ~104 KB `links-notation` to every install
for no functional benefit.
