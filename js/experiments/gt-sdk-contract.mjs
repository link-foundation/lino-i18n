// Exercise the published SDK's HTTP protocol against a local mock service.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { GT } from 'generaltranslation';
import {
  createGTProvider,
  createGTCatalogLoader,
  createGTSourceFile,
} from '../src/providers/gt.js';

const requests = [];
const file = {
  fileId: 'fixture-file',
  versionId: 'fixture-version',
  branchId: 'preview',
  fileName: 'app.json',
  fileFormat: 'JSON',
  dataFormat: 'ICU',
};
const translations = Object.fromEntries([
  ['greeting', 'Bonjour {name}'],
  ['__proto__', 'Réservé'],
]);
const server = createServer(async (request, response) => {
  try {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString());
    requests.push({ path: request.url, body });
    let data;
    if (request.url === '/v2/translate') {
      data = Object.fromEntries(
        Object.keys(body.requests).map((id) => [
          id,
          {
            success: true,
            translation: translations[body.requests[id].metadata.id],
            dataFormat: 'ICU',
            locale: body.targetLocale,
          },
        ])
      );
    } else if (request.url === '/v2/project/files/download') {
      data = {
        files: [
          {
            ...file,
            locale: 'fr',
            data: Buffer.from(JSON.stringify(translations)).toString('base64'),
          },
        ],
        count: 1,
      };
    } else if (request.url === '/v2/project/files/upload-files') {
      data = { uploadedFiles: [file], count: 1 };
    } else {
      throw new Error(`Unexpected SDK path ${request.url}`);
    }
    response.writeHead(request.url.endsWith('upload-files') ? 201 : 200, {
      'content-type': 'application/json',
    });
    response.end(JSON.stringify(data));
  } catch (error) {
    response.writeHead(400, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: error.message }));
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  // Fixture auth values are sent only to the loopback mock above.
  const sdk = new GT({
    projectId: 'fixture-project',
    userTokenProvider: {
      getAccessToken: () => Promise.resolve('fixture-token'),
    },
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    sourceLocale: 'en',
  });
  const messages = [
    { id: 'greeting', source: 'Hello {name}' },
    { id: '__proto__', source: 'Reserved' },
  ];
  const provider = createGTProvider(sdk);
  assert.deepEqual(await provider(messages, { locale: 'fr' }), translations);
  const uploaded = await sdk.uploadSourceFiles(
    [
      {
        source: createGTSourceFile(messages, {
          fileName: 'app.json',
          branchId: 'preview',
        }),
      },
    ],
    { sourceLocale: 'en' }
  );
  assert.equal(uploaded.uploadedFiles[0].fileId, file.fileId);
  const loader = createGTCatalogLoader(sdk, file);
  assert.deepEqual(await loader('fr', { version: 'v2' }), translations);
  assert.equal(
    Object.values(requests[0].body.requests).find(
      ({ metadata }) => metadata.id === 'greeting'
    ).metadata.dataFormat,
    'ICU'
  );
  assert.equal(requests[1].body.data[0].source.dataFormat, 'ICU');
  assert.deepEqual(
    JSON.parse(
      Buffer.from(requests[1].body.data[0].source.content, 'base64').toString()
    ),
    Object.fromEntries([
      ['greeting', 'Hello {name}'],
      ['__proto__', 'Reserved'],
    ])
  );
  assert.equal(requests[2].body[0].versionId, 'v2');
  console.log(
    'Published GT SDK: runtime ICU, source upload and versioned download verified'
  );
} finally {
  server.closeAllConnections();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
}
