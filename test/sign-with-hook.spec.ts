import assert from 'node:assert';
import { describe, it } from 'node:test';

import { signWithHook } from '../src/sign-with-hook';

describe('sign with hook', async () => {
  it('should call a hook function', async () => {
    let hookCalled = false;

    const hookFunction = (filePath) => {
      assert.equal(filePath, 'my/fake/file');
      hookCalled = true;
    };

    await signWithHook({
      files: ['my/fake/file'],
      hookFunction
    });

    assert.strictEqual(hookCalled, true);
  });

  it('should call a async hook function', async () => {
    let hookCalled = false;

    const hookFunction = async (filePath) => {
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
      hookFunction
    });

    assert.strictEqual(hookCalled, true);
  });

  it('should call a hook module', async () => {
    const fakeFile = `my/fake/file/${Date.now()}`;
    await signWithHook({
      files: [fakeFile],
      hookModulePath: './test/fixtures/hook-module.js'
    });

    assert.strictEqual(process.env.HOOK_MODULE_CALLED_WITH_FILE, fakeFile);
  });

  it('should call a hook function once when noIterateFiles is true', async () => {
    const functionCalled: string[] = [];

    const hookFunction = (options) => {
      functionCalled.push(options.files);
    };

    await signWithHook({
      files: ['my/fake/file1', 'my/fake/file2'],
      hookFunction,
      noIterateFiles: true
    });

    assert.deepStrictEqual(functionCalled, [['my/fake/file1', 'my/fake/file2']]);
  });
});
