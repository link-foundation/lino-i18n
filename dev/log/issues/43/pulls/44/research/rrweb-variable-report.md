`gt-rrweb@0.2.0` can translate a recorded variable value through the bare-string fallback after the marked message deliberately leaves that variable untouched. The same coverage calculation is still present in `packages/rrweb/src/harvest.ts` on main: `new Set(Object.keys(bag).map(Number))` covers only emitted translations, not all text nodes owned by marked messages.

Minimal reproduction (`import { harvestLocales } from 'gt-rrweb/harvest'`):

```js
const events = [{ type: 2, timestamp: 1, data: {
  initialOffset: { top: 0, left: 0 },
  node: { type: 2, id: 2, tagName: 'span', attributes: { 'data-_gt-hash': 'greeting' },
    childNodes: [
      { type: 3, id: 3, textContent: 'Hello ' },
      { type: 3, id: 4, textContent: 'Ada' },
      { type: 3, id: 5, textContent: '!' },
    ] },
} }];
const dict = { greeting: ['Bonjour ', { k: 'name' }, ' !'], Ada: 'Adele' };
const result = await harvestLocales(events, ['en', 'fr'], {
  sourceLocale: 'en', loadTranslations: async () => dict, hashMessage: text => text,
});
console.log(result); // { fr: { 3: 'Bonjour ', 4: 'Adele', 5: ' !' } }
```

Expected: node 4 stays as the recorded `Ada`, with no entry in the overlay. A dictionary entry for the unrelated source message `Ada` should not reinterpret a variable inside a marked message. The same ownership issue can affect unchanged leaves or a marked entry rejected for structural/branch ambiguity.

Suggested fix: compute fallback coverage from all marked message text nodes, before and independently of the translated `bag`:

```js
const covered = new Set(hashNodes.flatMap(node => node.textNodes.map(text => text.id)));
```

Keep the existing variable/structure checks in `overlayFromDict`; add a regression with the variable value also present as a bare-message dictionary key, plus untranslated/ambiguous marked entries and a genuinely unmarked text node to ensure fallback still works there.

Local workaround and existing regression: https://github.com/link-foundation/lino-i18n/pull/44 retains the wrapper in `js/src/rrweb/harvest.js` and `js/tests/rrweb.test.js`. The finite upstream-only reproduction is `experiments/issue-43-rrweb-fallback.mjs`. No browser, network, or large recording is needed. Searching this repository's issues for `rrweb` returned no existing report on November 13, 2026.
