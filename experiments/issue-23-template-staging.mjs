// A bounded reproduction of the remaining template diagnostic gap. No writes.
import { publishWithRetry } from '../dev/log/issues/23/pulls/24/templates/js/scripts/publish-retry.mjs';
const result = await publishWithRetry({
  publish: async () => ({ success: false, output: 'E409 Cannot publish over previously staged version "1.0.0"' }),
  verify: async () => false,
  sleepFn: async () => {},
  verifyOptions: { attempts: 2 },
  log: console.log,
});
console.log({ success: result.success, publishAttempts: result.publishAttempts, diagnostic: result.error.message });
