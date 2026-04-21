import assert from 'node:assert';
import { describe, it } from 'node:test';

import { signWithHook } from '../src/sign-with-hook.js';

void describe('sign with hook', async () => {
  void it('should call a hook function', async () => {
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

  void it('should call a async hook function', async () => {
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

  void it('should call a hook module', async () => {
    const fakeFile = `my/fake/file/${Date.now()}`;
    await signWithHook({
      files: [fakeFile],
      hookModulePath: './test/fixtures/hook-module.js',
    });

    assert.strictEqual(process.env.HOOK_MODULE_CALLED_WITH_FILE, fakeFile);
  });

  void it('should throw an error from a hook function', async () => {
    const hookFunction = (filePath: string) => {
      throw new Error(`failed to sign ${filePath}`);
    };

    await assert.rejects(
      signWithHook({
        files: ['my/fake/file'],
        hookFunction,
      }),
      /failed to sign my\/fake\/file/,
    );
  });

  void it('should throw an error from an async hook function', async () => {
    const hookFunction = async (filePath: string) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new Error(`failed to sign ${filePath}`);
    };

    await assert.rejects(
      signWithHook({
        files: ['my/fake/file'],
        hookFunction,
      }),
      /failed to sign my\/fake\/file/,
    );
  });

  void it('should throw an error from a hook module', async () => {
    await assert.rejects(
      signWithHook({
        files: ['my/fake/file'],
        hookModulePath: './test/fixtures/hook-module-error.js',
      }),
      /failed to sign my\/fake\/file/,
    );
  });
});
