import { HASHES, SignOptions, SignOptionsForDirectory, SignOptionsForFiles, SignToolOptions, InternalSignOptions, InternalSignToolOptions, OptionalSignToolOptions, HookFunction, OptionalHookOptions, InternalHookOptions } from './types.js';

// Mock the global Jest methods to satisfy TypeScript
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;

describe('Types', () => {
  describe('HASHES enum', () => {
    it('should have correct values', () => {
      expect(HASHES.sha1).toBe('sha1');
      expect(HASHES.sha256).toBe('sha256');
    });
  });

  describe('SignOptions type', () => {
    it('should be a union of SignOptionsForDirectory and SignOptionsForFiles', () => {
      // This test primarily validates the type definition at compile time
      const directoryOption: SignOptions = {
        appDirectory: 'path/to/app'
      };
      const filesOption: SignOptions = {
        files: ['file1.exe', 'file2.dll']
      };

      expect(directoryOption).toBeDefined();
      expect(filesOption).toBeDefined();
    });
  });

  describe('SignOptionsForDirectory interface', () => {
    it('should have appDirectory property', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: 'path/to/app'
      };

      expect(options.appDirectory).toBe('path/to/app');
    });

    it('should extend SignToolOptions', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: 'path/to/app',
        certificateFile: 'cert.pfx',
        certificatePassword: 'password'
      };

      expect(options.appDirectory).toBe('path/to/app');
      expect(options.certificateFile).toBe('cert.pfx');
      expect(options.certificatePassword).toBe('password');
    });
  });

  describe('SignOptionsForFiles interface', () => {
    it('should have files property', () => {
      const files = ['file1.exe', 'file2.dll'];
      const options: SignOptionsForFiles = {
        files
      };

      expect(options.files).toEqual(files);
    });

    it('should extend SignToolOptions', () => {
      const options: SignOptionsForFiles = {
        files: ['file1.exe', 'file2.dll'],
        certificateFile: 'cert.pfx',
        certificatePassword: 'password'
      };

      expect(options.files).toEqual(['file1.exe', 'file2.dll']);
      expect(options.certificateFile).toBe('cert.pfx');
      expect(options.certificatePassword).toBe('password');
    });
  });

  describe('SignToolOptions interface', () => {
    it('should extend both OptionalSignToolOptions and OptionalHookOptions', () => {
      const options: SignToolOptions = {
        certificateFile: 'cert.pfx',
        certificatePassword: 'password',
        hookFunction: (file: string) => {
          console.log(`Signing ${file}`);
        }
      };

      expect(options.certificateFile).toBe('cert.pfx');
      expect(options.certificatePassword).toBe('password');
      expect(typeof options.hookFunction).toBe('function');
    });
  });

  describe('InternalSignOptions interface', () => {
    it('should extend SignOptionsForFiles', () => {
      const options: InternalSignOptions = {
        files: ['file1.exe', 'file2.dll']
      };

      expect(options.files).toEqual(['file1.exe', 'file2.dll']);
    });
  });

  describe('InternalSignToolOptions interface', () => {
    it('should have required properties', () => {
      const options: InternalSignToolOptions = {
        signToolPath: 'path/to/signtool.exe',
        timestampServer: 'http://timestamp.digicert.com',
        files: ['file1.exe', 'file2.dll'],
        hash: HASHES.sha256
      };

      expect(options.signToolPath).toBe('path/to/signtool.exe');
      expect(options.timestampServer).toBe('http://timestamp.digicert.com');
      expect(options.files).toEqual(['file1.exe', 'file2.dll']);
      expect(options.hash).toBe(HASHES.sha256);
    });

    it('should extend OptionalSignToolOptions and OptionalHookOptions', () => {
      const options: InternalSignToolOptions = {
        signToolPath: 'path/to/signtool.exe',
        timestampServer: 'http://timestamp.digicert.com',
        files: ['file1.exe', 'file2.dll'],
        hash: HASHES.sha256,
        certificateFile: 'cert.pfx',
        hookFunction: async (file: string) => {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      };

      expect(options.signToolPath).toBe('path/to/signtool.exe');
      expect(options.timestampServer).toBe('http://timestamp.digicert.com');
      expect(options.files).toEqual(['file1.exe', 'file2.dll']);
      expect(options.hash).toBe(HASHES.sha256);
      expect(options.certificateFile).toBe('cert.pfx');
      expect(typeof options.hookFunction).toBe('function');
    });

    it('should have optional appendSignature property', () => {
      const optionsWithAppend: InternalSignToolOptions = {
        signToolPath: 'path/to/signtool.exe',
        timestampServer: 'http://timestamp.digicert.com',
        files: ['file1.exe', 'file2.dll'],
        hash: HASHES.sha256,
        appendSignature: true
      };

      const optionsWithoutAppend: InternalSignToolOptions = {
        signToolPath: 'path/to/signtool.exe',
        timestampServer: 'http://timestamp.digicert.com',
        files: ['file1.exe', 'file2.dll'],
        hash: HASHES.sha256
        // appendSignature is omitted
      };

      expect(optionsWithAppend.appendSignature).toBe(true);
      expect(optionsWithoutAppend.appendSignature).toBeUndefined();
    });
  });

  describe('OptionalSignToolOptions interface', () => {
    it('should have optional properties', () => {
      // Testing with minimal options to ensure all are optional
      const options: OptionalSignToolOptions = {};

      // Testing with all options to ensure they're accepted
      const fullOptions: OptionalSignToolOptions = {
        certificateFile: 'cert.pfx',
        certificatePassword: 'password',
        timestampServer: 'http://timestamp.digicert.com',
        description: 'Test description',
        website: 'https://example.com',
        signToolPath: 'path/to/signtool.exe',
        signWithParams: '/pa /v',
        debug: true,
        automaticallySelectCertificate: true,
        signJavaScript: false,
        hashes: [HASHES.sha1, HASHES.sha256]
      };

      expect(options).toBeDefined();
      expect(fullOptions.certificateFile).toBe('cert.pfx');
      expect(fullOptions.certificatePassword).toBe('password');
      expect(fullOptions.timestampServer).toBe('http://timestamp.digicert.com');
      expect(fullOptions.description).toBe('Test description');
      expect(fullOptions.website).toBe('https://example.com');
      expect(fullOptions.signToolPath).toBe('path/to/signtool.exe');
      expect(fullOptions.signWithParams).toBe('/pa /v');
      expect(fullOptions.debug).toBe(true);
      expect(fullOptions.automaticallySelectCertificate).toBe(true);
      expect(fullOptions.signJavaScript).toBe(false);
      expect(fullOptions.hashes).toEqual([HASHES.sha1, HASHES.sha256]);
    });

    it('should accept signWithParams as string or array', () => {
      const stringParam: OptionalSignToolOptions = {
        signWithParams: '/pa /v'
      };

      const arrayParam: OptionalSignToolOptions = {
        signWithParams: ['/pa', '/v']
      };

      expect(stringParam.signWithParams).toBe('/pa /v');
      expect(arrayParam.signWithParams).toEqual(['/pa', '/v']);
    });
  });

  describe('HookFunction type', () => {
    it('should accept function that takes string and returns void or Promise<void>', () => {
      const syncHook: HookFunction = (fileToSign: string): void => {
        console.log(`Sync signing ${fileToSign}`);
      };

      const asyncHook: HookFunction = async (fileToSign: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 1));
        console.log(`Async signing ${fileToSign}`);
      };

      expect(typeof syncHook).toBe('function');
      expect(typeof asyncHook).toBe('function');

      // Test that they can be called without error
      expect(() => syncHook('test.exe')).not.toThrow();
    });
  });

  describe('OptionalHookOptions interface', () => {
    it('should have optional hook properties', () => {
      const options: OptionalHookOptions = {};

      const fullOptions: OptionalHookOptions = {
        hookFunction: (file: string) => {
          console.log(`Signing ${file}`);
        },
        hookModulePath: 'path/to/hook.js'
      };

      expect(options).toBeDefined();

      if (fullOptions.hookFunction) {
        expect(typeof fullOptions.hookFunction).toBe('function');
      }
      expect(fullOptions.hookModulePath).toBe('path/to/hook.js');
    });
  });

  describe('InternalHookOptions interface', () => {
    it('should have required files property', () => {
      const options: InternalHookOptions = {
        files: ['file1.exe', 'file2.dll']
      };

      expect(options.files).toEqual(['file1.exe', 'file2.dll']);
    });

    it('should extend OptionalHookOptions', () => {
      const options: InternalHookOptions = {
        files: ['file1.exe', 'file2.dll'],
        hookFunction: (file: string) => {
          console.log(`Signing ${file}`);
        }
      };

      expect(options.files).toEqual(['file1.exe', 'file2.dll']);
      if (options.hookFunction) {
        expect(typeof options.hookFunction).toBe('function');
      }
    });
  });
});