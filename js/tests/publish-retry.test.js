import assert from 'node:assert/strict';
import test from 'node:test';
import { publishWithRetry } from '../scripts/publish-retry.mjs';
import { isPackageVersionPublished } from '../scripts/npm-registry.mjs';

const immediate = async () => {};
const options = { sleepFn: immediate, verifyOptions: { attempts: 4 } };

test('accepted publish polls through delayed visibility without another write', async () => {
  let writes = 0;
  let reads = 0;
  const result = await publishWithRetry({
    ...options,
    publish: async () => {
      writes++;
      return { success: true };
    },
    verify: async () => ++reads === 4,
  });
  assert.equal(result.success, true);
  assert.equal(writes, 1);
  assert.equal(reads, 4);
});

test('staged conflict polls once and fails with approval guidance when not public', async () => {
  let writes = 0;
  const result = await publishWithRetry({
    ...options,
    publish: async () => {
      writes++;
      return {
        success: false,
        output: 'E409 Cannot publish over previously staged version "0.3.0"',
      };
    },
    verify: async () => false,
  });
  assert.equal(result.success, false);
  assert.equal(writes, 1);
  assert.match(result.error.message, /npm stage approve/);
});

test('registry outages stay unknown instead of claiming a missing package', async () => {
  let writes = 0;
  await assert.rejects(
    publishWithRetry({
      ...options,
      publish: async () => {
        writes++;
        return { success: true };
      },
      verify: async () => {
        throw new Error('HTTP 503');
      },
    }),
    /unknown state/
  );
  assert.equal(writes, 1);
});

test('transient command failure retries, permanent authentication failure does not', async () => {
  let writes = 0;
  const result = await publishWithRetry({
    ...options,
    publish: async () =>
      ++writes === 1
        ? { success: false, error: new Error('ECONNRESET') }
        : { success: true },
    verify: async () => true,
  });
  assert.equal(result.success, true);
  assert.equal(writes, 2);
  const denied = await publishWithRetry({
    ...options,
    publish: async () => ({
      success: false,
      error: Object.assign(new Error('E403'), { nonRetryable: true }),
    }),
    verify: async () => true,
  });
  assert.equal(denied.publishAttempts, 1);
});

test('fresh exact-version metadata distinguishes 404, errors, and malformed responses', async () => {
  const check = (response) =>
    isPackageVersionPublished('@scope/pkg', '1.0.0', {
      fetchFn: async (url, init) => {
        assert.match(url, /@scope%2Fpkg\/1\.0\.0\?cache-bust=/);
        assert.equal(init.headers['cache-control'], 'no-cache');
        return response;
      },
    });
  assert.equal(await check({ status: 404 }), false);
  assert.equal(
    await check({
      status: 200,
      ok: true,
      json: async () => ({ version: '1.0.0' }),
    }),
    true
  );
  await assert.rejects(
    check({ status: 503, statusText: 'Unavailable', ok: false }),
    /503/
  );
  await assert.rejects(
    check({ status: 200, ok: true, json: async () => ({}) }),
    /unexpected/
  );
});
