import assert from 'node:assert/strict';
import { test } from 'node:test';

import { signRequest } from './sigv4.ts';

// AWS's published examples (S3 API reference, "Signature Calculations for the Authorization
// Header: Transferring Payload in a Single Chunk"), with their example credentials.
const CREDENTIALS = {
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
};
const NOW = new Date('2013-05-24T00:00:00Z');

function signatureOf(headers: Record<string, string>): string | undefined {
  return /Signature=([0-9a-f]+)/.exec(headers['authorization'] ?? '')?.[1];
}

test('GET Object example', async () => {
  const headers = await signRequest({
    method: 'GET',
    url: new URL('https://examplebucket.s3.amazonaws.com/test.txt'),
    credentials: CREDENTIALS,
    region: 'us-east-1',
    headers: { Range: 'bytes=0-9' },
    now: NOW,
  });
  assert.equal(
    signatureOf(headers),
    'f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41',
  );
  assert.match(
    headers['authorization'] ?? '',
    /SignedHeaders=host;range;x-amz-content-sha256;x-amz-date,/,
  );
});

test('PUT Object example (payload hashed, path segment encoded)', async () => {
  const headers = await signRequest({
    method: 'PUT',
    url: new URL('https://examplebucket.s3.amazonaws.com/test$file.text'),
    credentials: CREDENTIALS,
    region: 'us-east-1',
    body: 'Welcome to Amazon S3.',
    headers: { Date: 'Fri, 24 May 2013 00:00:00 GMT', 'x-amz-storage-class': 'REDUCED_REDUNDANCY' },
    now: NOW,
  });
  assert.equal(
    signatureOf(headers),
    '98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd',
  );
});

test('host is signed but not returned (fetch sets it)', async () => {
  const headers = await signRequest({
    method: 'GET',
    url: new URL('https://example.com/a'),
    credentials: CREDENTIALS,
    region: 'auto',
    now: NOW,
  });
  assert.equal(headers['host'], undefined);
  assert.equal(headers['x-amz-date'], '20130524T000000Z');
});
