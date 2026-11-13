Registry snapshot: 2026-11-13T22:32:46.290698+00:00. `Before` is main at 3da5027; `after` is this PR.

Every workflow/composite uses reference. Tag release metadata, annotated-tag dereferencing and immutable SHAs are preserved in action-releases.json. CodeQL bundle releases are not action SemVer releases.

| Action / image | Before ref | After ref | Latest release | Release commit | Reason |
| --- | --- | --- | --- | --- | --- |
| Swatinem/rust-cache | d1527c8f67ef9af357290475d4af4b0fab8f12e0 | d1527c8f67ef9af357290475d4af4b0fab8f12e0 | v2.9.3 | d1527c8f67ef9af357290475d4af4b0fab8f12e0 | Current immutable commit. |
| actions/checkout | v7 | v7 | v7.0.1 | 3d3c42e5aac5ba805825da76410c181273ba90b1 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| actions/configure-pages | v6 | v6 | v6.0.0 | 45bfe0192ca1faeb007ade9deae92b16b8254a0d | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| actions/dependency-review-action | v5 | v5 | v5.0.0 | a1d282b36b6f3519aa1f3fc636f609c47dddb294 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| actions/deploy-pages | v5 | v5 | v5.0.1 | 368f82528645a54fb793d4d04e342629a3f51346 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| actions/setup-node | v7 | v7 | v7.1.0 | 949feb2413d6458794dcd2491c4babbbce0c15c1 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| actions/setup-python | v7 | v7 | v7.1.0 | 6d4fd22b20465ccc0f7354476588e8df7c9ca0e0 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| actions/upload-artifact | v7 | v7 | v7.0.2 | cf430e030ddbb5b0abf93d22962f4752f3646cd9 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| actions/upload-pages-artifact | v5 | v5 | v5.0.0 | fc324d3547104276b827a68afc52ff2a11cc49c9 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| denoland/setup-deno | 22d081ff2d3a40755e97629de92e3bcbfa7cf2ed | 22d081ff2d3a40755e97629de92e3bcbfa7cf2ed | v2.0.5 | 22d081ff2d3a40755e97629de92e3bcbfa7cf2ed | Current immutable commit. |
| docker/build-push-action | v7 | v7 | v7.4.0 | c3c9e263c25d99ce0380d002d59b67737d91b0dc | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| docker/login-action | v4 | v4 | v4.8.0 | 8aa5831fb8d48d8f76594c7ddde61ae58019f550 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| docker/metadata-action | v6 | v6 | v6.2.0 | dc802804100637a589fabce1cb79ff13a1411302 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| docker/setup-buildx-action | v4 | v4 | v4.4.1 | f87e5991a6d7451dcb8d9637bfbc97413f497069 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| docker://rhysd/actionlint | sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667 | sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667 | v1.7.12 | 914e7df21a07ef503a81201c76d2b11c789d3fca | Current release image; digest verified against Docker Hub. Existing schema-gap reports remain open. |
| dtolnay/rust-toolchain | 683b588c487a69d01f6c6ddf40f036ff682cc2c8 | 683b588c487a69d01f6c6ddf40f036ff682cc2c8 | v1 | 683b588c487a69d01f6c6ddf40f036ff682cc2c8 | No versioned releases; v1 is the maintained immutable action entrypoint; toolchain selected separately. |
| github/codeql-action/analyze | v4 | v4 | v4.39.3 | 33d7b85da1a04171e211befe2c739303b9a4c066 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| github/codeql-action/init | v4 | v4 | v4.39.3 | 33d7b85da1a04171e211befe2c739303b9a4c066 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| lycheeverse/lychee-action | v2 | v2 | v2.9.0 | e7477775783ea5526144ba13e8db5eec57747ce8 | Newest maintained major tag resolves to current release; existing trusted-publisher pin policy retained. |
| oven-sh/setup-bun | 0c5077e51419868618aeaa5fe8019c62421857d6 | 0c5077e51419868618aeaa5fe8019c62421857d6 | v2.2.0 | 0c5077e51419868618aeaa5fe8019c62421857d6 | Current immutable commit. |
| peter-evans/create-pull-request | 5f6978faf089d4d20b00c7766989d076bb2fc7f1 | 3ffccacd46053766916f087ce41d627c0b8cf2d1 | v8.1.3 | 3ffccacd46053766916f087ce41d627c0b8cf2d1 | Current immutable commit. |
| rust-lang/crates-io-auth-action | 3268eb413133e2960fa4ae0e963ca76380c54cd9 | 3268eb413133e2960fa4ae0e963ca76380c54cd9 | v1.0.6 | 3268eb413133e2960fa4ae0e963ca76380c54cd9 | Current immutable commit. |
| taiki-e/install-action | 86f7a0ffb25f40114606501a311ebcfaf882ea32 | cfdb7ed4ccc7c7dce37759eae89dc5674b469b39 | v2.90.3 | cfdb7ed4ccc7c7dce37759eae89dc5674b469b39 | Current immutable commit. |
