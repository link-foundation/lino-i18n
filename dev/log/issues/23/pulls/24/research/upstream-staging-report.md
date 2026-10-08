While fixing [lino-i18n#23](https://github.com/link-foundation/lino-i18n/issues/23), we reproduced the same accepted-publish/read-404/republish-E409 sequence in [run 37561074975](https://github.com/link-foundation/lino-i18n/actions/runs/37561074975). The classifier fix in this issue is already present at template commit `4973fc4cedd4a1b5cf51fa6a3b2ddd56e6741549`, and we reused it.

There is an additional diagnostic distinction: npm staged publishing can require a maintainer's approval. E409 alone does **not** establish eventual public visibility. The original lino-i18n log cannot distinguish propagation delay from approval; we should preserve that uncertainty.

Bounded reproduction against the current template (no registry writes):

```js
import { publishWithRetry } from './scripts/publish-retry.mjs';
const result = await publishWithRetry({
  publish: async () => ({ success: false, output: 'E409 Cannot publish over previously staged version "1.0.0"' }),
  verify: async () => false,
  sleepFn: async () => {},
  verifyOptions: { attempts: 2 },
});
console.log(result.publishAttempts, result.error.message);
// 1, Package not found on npm after publish; verification polling exhausted
```

The bounded failure and refusal to republish are correct. Suggested code improvement: retain those behaviors, clarify the staged-pattern comments, and append actionable staging guidance to `verificationOutcome(false)`: check `npm stage list`, approve a matching stage with a maintainer credential and required 2FA, or explicitly configure direct publishing for this trusted publisher. Do not report publication success until the exact version is anonymously readable.

Workaround: a maintainer inspects and approves the stage before retrying the release verification. OIDC cannot list/approve stages, so the CI workflow cannot safely implement an approval bypass.

Primary documentation: [staged publishing](https://docs.npmjs.com/staged-publishing/), [trusted publishing](https://docs.npmjs.com/trusted-publishers/), [npm stage](https://docs.npmjs.com/cli/v11/commands/npm-stage/).
