// Mock the global Jest methods to satisfy TypeScript
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jest: any;

// Mock log function at module level
const mockLog = jest.fn();
jest.mock('./utils/log.js', () => ({
  log: (...args: any[]) => mockLog(...args),
}));

import path from 'node:path';
import { signWithHook } from './sign-with-hook.js';
import { InternalSignOptions } from './types.js';
import { log } from './utils/log.js';

// Helper function to create mock options
function createMockOptions(overrides: Partial<InternalSignOptions> = {}): InternalSignOptions {
  return {
    files: [],
    hookModulePath: undefined,
    hookFunction: undefined,
    ...overrides,
  };
}

describe('signWithHook', () => {
  beforeEach(() => {
    mockLog.mockClear(); // Clear previous log calls
  });

  it('should call hookFunction for each file when hookFunction is provided', async () => {
    const mockHookFunction = jest.fn().mockResolvedValue(undefined);
    const files = ['file1.exe', 'file2.exe'];

    const options: InternalSignOptions = createMockOptions({
      files,
      hookFunction: mockHookFunction,
    });

    await signWithHook(options);

    expect(mockHookFunction).toHaveBeenCalledTimes(files.length);
    expect(mockHookFunction).toHaveBeenCalledWith('file1.exe');
    expect(mockHookFunction).toHaveBeenCalledWith('file2.exe');
  });

  it('should log error when hookFunction throws an error', async () => {
    const mockHookFunction = jest.fn().mockRejectedValue(new Error('Signing failed'));
    const files = ['file1.exe'];

    const options: InternalSignOptions = createMockOptions({
      files,
      hookFunction: mockHookFunction,
    });

    await signWithHook(options);

    expect(mockHookFunction).toHaveBeenCalledWith('file1.exe');
    expect(mockLog).toHaveBeenCalledWith('Error signing file1.exe', expect.any(Error));
  });

  it('should process multiple files even if some fail', async () => {
    const mockHookFunction = jest.fn().mockImplementation(async (file: string) => {
      if (file === 'bad-file.exe') {
        throw new Error('Signing failed');
      }
      return Promise.resolve();
    });

    const files = ['good-file1.exe', 'bad-file.exe', 'good-file2.exe'];

    const options: InternalSignOptions = createMockOptions({
      files,
      hookFunction: mockHookFunction,
    });

    await signWithHook(options);

    expect(mockHookFunction).toHaveBeenCalledTimes(3);
    expect(mockHookFunction).toHaveBeenCalledWith('good-file1.exe');
    expect(mockHookFunction).toHaveBeenCalledWith('bad-file.exe');
    expect(mockHookFunction).toHaveBeenCalledWith('good-file2.exe');
    expect(mockLog).toHaveBeenCalledWith('Error signing bad-file.exe', expect.any(Error));
  });

  it('should handle empty files array', async () => {
    const mockHookFunction = jest.fn().mockResolvedValue(undefined);

    const options: InternalSignOptions = createMockOptions({
      files: [],
      hookFunction: mockHookFunction,
    });

    await signWithHook(options);

    expect(mockHookFunction).not.toHaveBeenCalled();
    expect(mockLog).not.toHaveBeenCalled();
  });

  it('should work with async hook functions', async () => {
    const asyncHookFunction = jest.fn().mockImplementation(async (file: string) => {
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 10));
      return `processed ${file}`;
    });

    const files = ['async-file1.exe', 'async-file2.exe'];

    const options: InternalSignOptions = createMockOptions({
      files,
      hookFunction: asyncHookFunction,
    });

    await signWithHook(options);

    expect(asyncHookFunction).toHaveBeenCalledTimes(2);
    files.forEach(file => {
      expect(asyncHookFunction).toHaveBeenCalledWith(file);
    });
  });

  it('should handle hook function that returns values', async () => {
    const returningHookFunction = jest.fn().mockReturnValue('success');
    const files = ['return-file.exe'];

    const options: InternalSignOptions = createMockOptions({
      files,
      hookFunction: returningHookFunction,
    });

    await signWithHook(options);

    expect(returningHookFunction).toHaveBeenCalledWith('return-file.exe');
  });
});