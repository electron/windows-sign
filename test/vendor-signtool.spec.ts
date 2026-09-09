import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, it } from 'node:test';

const signtool = path.resolve(import.meta.dirname, '..', 'vendor', 'signtool.exe');

// signtool.exe is a Windows binary, so these smoke tests only run on Windows.
void describe('vendor/signtool.exe', { skip: process.platform !== 'win32' }, async () => {
  void it('runs and prints its usage', () => {
    // Without arguments, signtool prints usage and exits non-zero.
    const result = spawnSync(signtool, [], { encoding: 'utf8' });

    assert.strictEqual(result.error, undefined);
    assert.match(`${result.stdout}${result.stderr}`, /Usage: signtool/);
  });

  void it('supports /dlib (Azure Trusted Signing)', () => {
    const result = spawnSync(signtool, ['sign', '/?'], { encoding: 'utf8' });

    assert.strictEqual(result.error, undefined);
    assert.match(`${result.stdout}${result.stderr}`, /\/dlib/);
  });
});
