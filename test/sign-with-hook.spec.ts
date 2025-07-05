import assert from 'node:assert';
import { describe, it } from 'node:test';

import { signWithHook } from '../src/sign-with-hook.js';

describe('sign with hook', async () => {
  it('should call a hook function', async () => {
    let hookCalled = false;

    const hookFunction = (filePath: string) => {
      assert.equal(filePath, 'my/fake/file');
      hookCalled = true;
    };

    await signWithHook({
      files: ['my/fake/file'],
      hookFunction,
    });

    assert.strictEqual(hookCalled, true);
  });

  it('should call a async hook function', async () => {
    let hookCalled = false;

    const hookFunction = async (filePath: string) => {
      assert.equal(filePath, 'my/fake/file');

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          hookCalled = true;
          resolve();
        }, 10);
      });
    };

    await signWithHook({
      files: ['my/fake/file'],
      hookFunction,
    });

    assert.strictEqual(hookCalled, true);
  });

  it('should call a hook module', async () => {
    const fakeFile = `my/fake/file/${Date.now()}`;
    await signWithHook({
      files: [fakeFile],
      hookModulePath: './test/fixtures/hook-module.js',
    });

    assert.strictEqual(process.env.HOOK_MODULE_CALLED_WITH_FILE, fakeFile);
  });
});
