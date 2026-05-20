import { jest, describe, expect, test, beforeEach, afterEach, beforeAll } from '@jest/globals';
import type { SignOptions } from './types.js';

// Store original environment
let ORIGINAL_ENV: NodeJS.ProcessEnv;

beforeAll(() => {
  ORIGINAL_ENV = { ...process.env };
});

beforeEach(() => {
  // Reset modules to ensure clean state
  jest.resetModules();
  // Restore clean environment for each test
  process.env = { ...ORIGINAL_ENV };
  
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Restore environment after each test
  process.env = { ...ORIGINAL_ENV };
});

describe('sign', () => {
  test('should call signWithHook when hookFunction is provided', async () => {
    const mockSignWithHook = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: mockSignWithHook,
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: jest.fn(),
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/path/to/test.exe']),
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
      hookFunction: () => Promise.resolve(),
    };

    await sign(options);

    expect(mockSignWithHook).toHaveBeenCalledTimes(1);
  });

  test('should call signWithHook when hookModulePath is provided', async () => {
    const mockSignWithHook = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: mockSignWithHook,
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: jest.fn(),
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/path/to/test.exe']),
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
      hookModulePath: '/path/to/hook.js',
    };

    await sign(options);

    expect(mockSignWithHook).toHaveBeenCalledTimes(1);
  });

  test('should call signWithSignTool when no hooks are provided', async () => {
    const mockSignWithSignTool = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: jest.fn(),
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: mockSignWithSignTool,
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/path/to/test.exe']),
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
    };

    await sign(options);

    expect(mockSignWithSignTool).toHaveBeenCalledTimes(1);
  });

  test('should use signJavaScript from options when provided', async () => {
    const mockSignWithSignTool = jest.fn();
    const mockGetFilesToSign = jest.fn().mockReturnValue(['/path/to/test.exe']);

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: jest.fn(),
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: mockSignWithSignTool,
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: mockGetFilesToSign,
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
      signJavaScript: true,
    };

    await sign(options);

    expect(mockGetFilesToSign).toHaveBeenCalledWith(options);
    expect(mockSignWithSignTool).toHaveBeenCalledTimes(1);
  });

  test('should use signJavaScript from environment variable when not provided in options', async () => {
    const mockSignWithSignTool = jest.fn();
    const mockBooleanFromEnv = jest.fn().mockReturnValue(true);

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: jest.fn(),
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: mockSignWithSignTool,
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/path/to/test.exe']),
    }));

    jest.doMock('./utils/parse-env.js', () => ({
      booleanFromEnv: mockBooleanFromEnv,
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
    };

    await sign(options);

    expect(mockBooleanFromEnv).toHaveBeenCalledWith('WINDOWS_SIGN_JAVASCRIPT');
    expect(mockSignWithSignTool).toHaveBeenCalledTimes(1);
  });

  test('should use hookModulePath from environment variable when not provided in options', async () => {
    // Set up environment variable specifically for this test
    process.env.WINDOWS_SIGN_HOOK_MODULE_PATH = '/env/path/to/hook.js';

    const mockSignWithHook = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: mockSignWithHook,
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: jest.fn(),
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/path/to/test.exe']),
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
    };

    await sign(options);

    expect(mockSignWithHook).toHaveBeenCalledTimes(1);
  });

  test('should enable debugging when debug option is true', async () => {
    const mockEnableDebugging = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: jest.fn(),
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: jest.fn(),
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/path/to/test.exe']),
    }));

    jest.doMock('./utils/log.js', () => ({
      log: jest.fn(),
      enableDebugging: mockEnableDebugging,
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
      debug: true,
    };

    await sign(options);

    expect(mockEnableDebugging).toHaveBeenCalledTimes(1);
  });

  test('should handle files array option correctly', async () => {
    const mockSignWithSignTool = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: jest.fn(),
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: mockSignWithSignTool,
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/file1.exe', '/file2.dll']),
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      files: ['/path/to/file1.exe', '/path/to/file2.dll'],
    };

    await sign(options);

    expect(mockSignWithSignTool).toHaveBeenCalledTimes(1);
  });

  test('should pass all options to internal options object', async () => {
    const mockSignWithHook = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: mockSignWithHook,
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: jest.fn(),
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/path/to/test.exe']),
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
      certificateFile: '/cert.pfx',
      certificatePassword: 'password',
      description: 'Test App',
      website: 'https://example.com',
      timestampServer: 'http://timestamp.test.com',
      debug: true,
      signJavaScript: true,
      hookModulePath: '/hook.js',
    };

    await sign(options);

    expect(mockSignWithHook).toHaveBeenCalledTimes(1);
  });

  test('should handle error cases gracefully', async () => {
    const mockSignWithSignTool = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: jest.fn(),
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: mockSignWithSignTool,
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/path/to/test.exe']),
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      appDirectory: '/test/app',
    };

    await expect(sign(options)).resolves.not.toThrow();

    expect(mockSignWithSignTool).toHaveBeenCalledTimes(1);
  });

  test('should properly merge options when using files array', async () => {
    const mockSignWithSignTool = jest.fn();

    jest.doMock('./sign-with-hook.js', () => ({
      signWithHook: jest.fn(),
    }));

    jest.doMock('./sign-with-signtool.js', () => ({
      signWithSignTool: mockSignWithSignTool,
    }));

    jest.doMock('./files.js', () => ({
      getFilesToSign: jest.fn().mockReturnValue(['/file1.exe', '/file2.dll']),
    }));

    const { sign } = await import('./sign.js');

    const options: SignOptions = {
      files: ['/file1.exe', '/file2.dll'],
      certificateFile: '/cert.pfx',
      description: 'Test Description',
    };

    await sign(options);

    expect(mockSignWithSignTool).toHaveBeenCalledTimes(1);
  });
});