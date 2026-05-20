import { spawnPromise, SpawnPromiseResult } from './spawn.js';

// Declare Jest globals to prevent TypeScript errors during compilation
declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

// Mock the child_process module
const mockStdoutOn = jest.fn();
const mockStderrOn = jest.fn();
const mockOnClose = jest.fn();
const mockSpawn = jest.fn();

// Create mock streams
const mockReadStream = {
  on: mockStdoutOn,
};

const mockWriteStream = {
  on: mockStderrOn,
};

const mockChildProcess = {
  stdout: mockReadStream,
  stderr: mockWriteStream,
  on: mockOnClose,
};

jest.mock('node:child_process', () => ({
  spawn: mockSpawn,
}));

describe('spawn', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock implementations
    mockSpawn.mockReturnValue(mockChildProcess);
    mockStdoutOn.mockReset();
    mockStderrOn.mockReset();
    mockOnClose.mockReset();
  });

  describe('spawnPromise', () => {
    it('should spawn a process with given name and arguments', async () => {
      // Arrange
      const name = 'echo';
      const args = ['hello'];
      const mockData = 'hello\n';

      // Setup mock callbacks
      mockOnClose.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 0); // Simulate async close
        }
      });

      mockStdoutOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(mockData), 0); // Simulate async data
        }
      });

      mockStderrOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(''), 0); // No stderr for this test
        }
      });

      // Act
      const result = await spawnPromise(name, args);

      // Assert
      expect(mockSpawn).toHaveBeenCalledWith(name, args, {});
      expect(result).toEqual({
        stdout: mockData,
        stderr: '',
        code: 0
      });
    });

    it('should handle stderr output', async () => {
      // Arrange
      const name = 'test-command';
      const args = ['--version'];
      const mockStderrData = 'error occurred\n';

      // Setup mock callbacks
      mockOnClose.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 0); // Return error code
        }
      });

      mockStdoutOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(''), 0); // No stdout for this test
        }
      });

      mockStderrOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(mockStderrData), 0);
        }
      });

      // Act
      const result = await spawnPromise(name, args);

      // Assert
      expect(result).toEqual({
        stdout: '',
        stderr: mockStderrData,
        code: 1
      });
    });

    it('should accept custom spawn options', async () => {
      // Arrange
      const name = 'ls';
      const args = ['-la'];
      const options = { cwd: '/tmp', env: { PATH: '/usr/bin' } };

      // Setup mock callbacks
      mockOnClose.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 0);
        }
      });

      mockStdoutOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          setTimeout(() => callback('output'), 0);
        }
      });

      mockStderrOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(''), 0);
        }
      });

      // Act
      const result = await spawnPromise(name, args, options);

      // Assert
      expect(mockSpawn).toHaveBeenCalledWith(name, args, options);
      expect(result.stdout).toContain('output');
    });

    it('should accumulate multiple data chunks', async () => {
      // Arrange
      const name = 'echo';
      const args = ['multi-line'];
      const chunk1 = 'first line\n';
      const chunk2 = 'second line\n';

      // Setup mock callbacks
      let stdoutCallback: ((data: any) => void) | undefined;
      let stderrCallback: ((data: any) => void) | undefined;
      let closeCallback: ((code: number) => void) | undefined;

      mockStdoutOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          stdoutCallback = callback;
        }
      });

      mockStderrOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          stderrCallback = callback;
        }
      });

      mockOnClose.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          closeCallback = callback;
        }
      });

      // Start the promise
      const resultPromise = spawnPromise(name, args);

      // Allow event loop to process the initial setup before triggering callbacks
      await new Promise(resolve => setImmediate(resolve));

      // Simulate multiple data chunks being received
      if (stdoutCallback) {
        stdoutCallback(chunk1);
        stdoutCallback(chunk2);
      }

      // Close the process to resolve the promise
      if (closeCallback) {
        closeCallback(0);
      }

      // Wait for the promise to resolve
      const result = await resultPromise;

      // Assert
      expect(result).toEqual({
        stdout: chunk1 + chunk2,
        stderr: '',
        code: 0
      });
    });

    it('should return correct exit code', async () => {
      // Arrange
      const name = 'false'; // Command that typically exits with code 1
      const testArgs: string[] = [];
      const exitCode = 1;

      // Setup mock callbacks
      mockOnClose.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(exitCode), 0);
        }
      });

      mockStdoutOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(''), 0);
        }
      });

      mockStderrOn.mockImplementation((event: string, callback: (data: any) => void) => {
        if (event === 'data') {
          setTimeout(() => callback(''), 0);
        }
      });

      // Act
      const result = await spawnPromise(name, testArgs);

      // Assert
      expect(result.code).toBe(exitCode);
    });
  });
});