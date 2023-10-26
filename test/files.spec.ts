import assert from 'node:assert';
import { describe, it } from 'node:test';
import path from 'path';

import { getFilesToSign } from '../src/files';

describe('files', async () => {
  it('gets files to sign', () => {
    const files = getFilesToSign({
      appDirectory: path.resolve(__dirname, 'fixtures', 'app')
    });

    const expectedFiles = [
      'fake.cab',
      'fake.dll',
      'fake.exe',
      'fake.msix',
      'fake.node'
    ].map((f) => path.join(__dirname, 'fixtures', 'app', f));

    assert.deepEqual(files, expectedFiles);
  });

  it('gets files to sign (with JS files)', () => {
    const files = getFilesToSign({
      appDirectory: path.resolve(__dirname, 'fixtures', 'app'),
      signJavaScript: true
    });

    const expectedFiles = [
      'fake.cab',
      'fake.dll',
      'fake.exe',
      'fake.js',
      'fake.msix',
      'fake.node'
    ].map((f) => path.join(__dirname, 'fixtures', 'app', f));

    assert.deepEqual(files, expectedFiles);
  });
});
