// Finite upstream-only reproduction: a recorded variable must stay on source.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(new URL("../js/package.json", import.meta.url));
const { harvestLocales } = require("gt-rrweb/harvest");
const events = [
  {
    type: 2,
    timestamp: 1,
    data: {
      initialOffset: { top: 0, left: 0 },
      node: {
        type: 2,
        id: 2,
        tagName: "span",
        attributes: { "data-_gt-hash": "greeting" },
        childNodes: [
          { type: 3, id: 3, textContent: "Hello " },
          { type: 3, id: 4, textContent: "Ada" },
          { type: 3, id: 5, textContent: "!" },
        ],
      },
    },
  },
];
const dict = { greeting: ["Bonjour ", { k: "name" }, " !"], Ada: "Adele" };
const overlay = await harvestLocales(events, ["en", "fr"], {
  sourceLocale: "en",
  loadTranslations: async () => dict,
  hashMessage: (text) => text,
});
console.log(JSON.stringify(overlay));
assert.equal(
  overlay.fr[4],
  "Adele",
  "Reproduce the variable incorrectly entering the bare-string fallback",
);
