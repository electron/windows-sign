// Mock the graceful-fs module before importing the module under test
jest.mock('graceful-fs');

import fs from 'graceful-fs';
import path from 'node:path';
import { getFilesToSign } from './files.js';
import { SignOptions, SignOptionsForFiles, SignOptionsForDirectory } from './types.js';

// Mock the global Jest methods to satisfy TypeScript
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const jest: any;

// Access the mocked functions after importing
const mockReaddirSync = fs.readdirSync as any;
const mockStatSync = fs.statSync as any;

describe('getFilesToSign', () => {
  beforeEach(() => {
    mockReaddirSync.mockClear();
    mockStatSync.mockClear();
  });

  describe('when options contains files array', () => {
    it('should return the files array directly', () => {
      const options: SignOptionsForFiles = {
        files: ['/path/to/file1.exe', '/path/to/file2.dll'],
      };

      const result = getFilesToSign(options);
      
      expect(result).toEqual(['/path/to/file1.exe', '/path/to/file2.dll']);
      expect(mockReaddirSync).not.toHaveBeenCalled();
    });
  });

  describe('when options specifies directory', () => {
    it('should scan directory for PE files', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // Mock directory contents containing PE files
      mockReaddirSync.mockReturnValue(['app.exe', 'lib.dll', 'readme.txt']);
      
      // Mock stats to indicate these are files (not directories)
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // app.exe
        .mockReturnValueOnce({ isDirectory: () => false } as any) // lib.dll
        .mockReturnValueOnce({ isDirectory: () => false } as any); // readme.txt

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'app.exe'));
      expect(result).toContain(path.resolve('/test/app', 'lib.dll'));
      expect(result).not.toContain(path.resolve('/test/app', 'readme.txt'));
      expect(mockReaddirSync).toHaveBeenCalledWith('/test/app');
    });

    it('should scan directory for MSI files', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // Mock directory contents containing MSI files
      mockReaddirSync.mockReturnValue(['installer.msi', 'document.pdf']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // installer.msi
        .mockReturnValueOnce({ isDirectory: () => false } as any); // document.pdf

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'installer.msi'));
      expect(result).not.toContain(path.resolve('/test/app', 'document.pdf'));
    });

    it('should scan directory for package files', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // Mock directory contents containing package files
      mockReaddirSync.mockReturnValue(['app.appx', 'app.appxbundle', 'regular.txt']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // app.appx
        .mockReturnValueOnce({ isDirectory: () => false } as any) // app.appxbundle
        .mockReturnValueOnce({ isDirectory: () => false } as any); // regular.txt

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'app.appx'));
      expect(result).toContain(path.resolve('/test/app', 'app.appxbundle'));
      expect(result).not.toContain(path.resolve('/test/app', 'regular.txt'));
    });

    it('should scan directory for CAT/CAB files', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // Mock directory contents containing CAT/CAB files
      mockReaddirSync.mockReturnValue(['driver.cat', 'setup.cab', 'image.png']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // driver.cat
        .mockReturnValueOnce({ isDirectory: () => false } as any) // setup.cab
        .mockReturnValueOnce({ isDirectory: () => false } as any); // image.png

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'driver.cat'));
      expect(result).toContain(path.resolve('/test/app', 'setup.cab'));
      expect(result).not.toContain(path.resolve('/test/app', 'image.png'));
    });

    it('should scan directory for Silverlight applications', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // Mock directory contents containing XAP files
      mockReaddirSync.mockReturnValue(['app.xap', 'stylesheet.css']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // app.xap
        .mockReturnValueOnce({ isDirectory: () => false } as any); // stylesheet.css

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'app.xap'));
      expect(result).not.toContain(path.resolve('/test/app', 'stylesheet.css'));
    });

    it('should scan directory for script files', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // Mock directory contents containing script files
      mockReaddirSync.mockReturnValue(['script.vbs', 'workflow.wsf', 'task.ps1', 'doc.txt']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // script.vbs
        .mockReturnValueOnce({ isDirectory: () => false } as any) // workflow.wsf
        .mockReturnValueOnce({ isDirectory: () => false } as any) // task.ps1
        .mockReturnValueOnce({ isDirectory: () => false } as any); // doc.txt

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'script.vbs'));
      expect(result).toContain(path.resolve('/test/app', 'workflow.wsf'));
      expect(result).toContain(path.resolve('/test/app', 'task.ps1'));
      expect(result).not.toContain(path.resolve('/test/app', 'doc.txt'));
    });

    it('should scan directory for JavaScript files when signJavaScript is true', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
        signJavaScript: true,
      };

      // Mock directory contents containing JS files
      mockReaddirSync.mockReturnValue(['app.js', 'styles.css']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // app.js
        .mockReturnValueOnce({ isDirectory: () => false } as any); // styles.css

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'app.js'));
      expect(result).not.toContain(path.resolve('/test/app', 'styles.css'));
    });

    it('should not scan for JavaScript files when signJavaScript is false', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
        signJavaScript: false,
      };

      // Mock directory contents containing JS files
      mockReaddirSync.mockReturnValue(['app.js', 'styles.css']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // app.js
        .mockReturnValueOnce({ isDirectory: () => false } as any); // styles.css

      const result = getFilesToSign(options);

      expect(result).not.toContain(path.resolve('/test/app', 'app.js'));
      expect(result).not.toContain(path.resolve('/test/app', 'styles.css'));
    });

    it('should not scan for JavaScript files when signJavaScript is not specified', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
        // signJavaScript is not specified
      };

      // Mock directory contents containing JS files
      mockReaddirSync.mockReturnValue(['app.js', 'styles.css']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // app.js
        .mockReturnValueOnce({ isDirectory: () => false } as any); // styles.css

      const result = getFilesToSign(options);

      expect(result).not.toContain(path.resolve('/test/app', 'app.js'));
      expect(result).not.toContain(path.resolve('/test/app', 'styles.css'));
    });

    it('should handle nested directories recursively', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // First call for the main directory
      mockReaddirSync.mockImplementation((dirPath: string) => {
        if (dirPath === '/test/app') {
          return ['app.exe', 'subdir'];
        } else if (dirPath === path.resolve('/test/app', 'subdir')) {
          return ['nested.dll', 'data.txt'];
        }
        return [];
      });

      // Mock stats - subdir is a directory, others are files
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // app.exe
        .mockReturnValueOnce({ isDirectory: () => true } as any)   // subdir
        .mockReturnValueOnce({ isDirectory: () => false } as any) // nested.dll
        .mockReturnValueOnce({ isDirectory: () => false } as any); // data.txt

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'app.exe'));
      expect(result).toContain(path.resolve('/test/app', 'subdir', 'nested.dll'));
      expect(result).not.toContain(path.resolve('/test/app', 'subdir', 'data.txt'));
    });

    it('should handle case-insensitive file extensions', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // Mock directory contents with uppercase extensions
      mockReaddirSync.mockReturnValue(['APP.EXE', 'LIB.DLL', 'INSTALLER.MSI']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // APP.EXE
        .mockReturnValueOnce({ isDirectory: () => false } as any) // LIB.DLL
        .mockReturnValueOnce({ isDirectory: () => false } as any); // INSTALLER.MSI

      const result = getFilesToSign(options);

      expect(result).toContain(path.resolve('/test/app', 'APP.EXE'));
      expect(result).toContain(path.resolve('/test/app', 'LIB.DLL'));
      expect(result).toContain(path.resolve('/test/app', 'INSTALLER.MSI'));
    });

    it('should return empty array when no matching files found', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/test/app',
      };

      // Mock directory contents with no matching files
      mockReaddirSync.mockReturnValue(['readme.txt', 'image.png', 'style.css']);
      mockStatSync
        .mockReturnValueOnce({ isDirectory: () => false } as any) // readme.txt
        .mockReturnValueOnce({ isDirectory: () => false } as any) // image.png
        .mockReturnValueOnce({ isDirectory: () => false } as any); // style.css

      const result = getFilesToSign(options);

      expect(result).toEqual([]);
    });

    it('should use default appDirectory when dir parameter is not provided', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/default/app',
      };

      mockReaddirSync.mockReturnValue(['app.exe']);
      mockStatSync.mockReturnValue({ isDirectory: () => false } as any);

      getFilesToSign(options);

      expect(mockReaddirSync).toHaveBeenCalledWith('/default/app');
    });

    it('should use provided dir parameter instead of options.appDirectory', () => {
      const options: SignOptionsForDirectory = {
        appDirectory: '/default/app',
      };
      const customDir = '/custom/dir';

      mockReaddirSync.mockReturnValue(['app.exe']);
      mockStatSync.mockReturnValue({ isDirectory: () => false } as any);

      getFilesToSign(options, customDir);

      expect(mockReaddirSync).toHaveBeenCalledWith('/custom/dir');
    });
  });
});