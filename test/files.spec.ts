import assert from 'node:assert';
import path from 'node:path';
import { describe, it } from 'node:test';

import { getFilesToSign } from '../src/files.js';

describe('files', async () => {
  it('gets files to sign', () => {
    const files = getFilesToSign({
      appDirectory: path.resolve(import.meta.dirname, 'fixtures', 'app'),
    });

    const expectedFiles = ['fake.cab', 'fake.dll', 'fake.exe', 'fake.msix', 'fake.node'].map((f) =>
      path.join(import.meta.dirname, 'fixtures', 'app', f),
    );

    assert.deepEqual(files, expectedFiles);
  });

  it('gets files to sign (with JS files)', () => {
    const files = getFilesToSign({
      appDirectory: path.resolve(import.meta.dirname, 'fixtures', 'app'),
      signJavaScript: true,
    });

    const expectedFiles = [
      'fake.cab',
      'fake.dll',
      'fake.exe',
      'fake.js',
      'fake.msix',
      'fake.node',
    ].map((f) => path.join(import.meta.dirname, 'fixtures', 'app', f));

    assert.deepEqual(files, expectedFiles);
  });
});
