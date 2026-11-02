---
'lino-i18n': patch
---

Fix the `lino-i18n` CLI doing nothing and exiting with code 0 when run through the npm bin symlink (`npx lino-i18n`, `node_modules/.bin/lino-i18n`, npm scripts). The entry-point check now compares real paths, so `lino-i18n check` reports out-of-sync catalogs again.
