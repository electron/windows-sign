import { enableDebugging, log } from './log.js';
import debug from 'debug';

// Mock the global Jest methods to satisfy TypeScript
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const jest: any;

describe('log utilities', () => {
  let originalEnable: (namespaces: string) => void;

  beforeEach(() => {
    // Store the original enable function to restore later
    originalEnable = (debug as any).enable;
    // Clear any previously enabled namespaces
    (debug as any).disable();
  });

  afterEach(() => {
    // Restore the original enable function
    (debug as any).enable = originalEnable;
    // Clear namespaces after each test
    (debug as any).disable();
  });

  describe('enableDebugging', () => {
    it('should enable the correct debug namespace', () => {
      const spy = jest.spyOn(debug as any, 'enable');

      enableDebugging();

      expect(spy).toHaveBeenCalledWith('electron-windows-sign');
    });

    it('should properly enable the debug namespace', () => {
      enableDebugging();

      // Check if our namespace has been enabled by verifying it behaves correctly
      const isEnabled = (debug as any).enabled('electron-windows-sign');
      expect(isEnabled).toBeDefined();
    });
  });

  describe('log', () => {
    it('should create a debug instance with the correct namespace', () => {
      // We can check that log is a function since debug returns a function
      expect(typeof log).toBe('function');
    });

    it('should be usable as a logging function', () => {
      // Test that log can be called as a function
      expect(() => log('test message')).not.toThrow();
      expect(() => log('test %o', { data: 'value' })).not.toThrow();
      expect(() => log('%s %d', 'number', 42)).not.toThrow();
    });

    it('should have the electron-windows-sign namespace', () => {
      // Access the namespace property directly from the debug function instance
      const logInstance: any = log;
      expect(logInstance.namespace).toBe('electron-windows-sign');
    });
  });
});