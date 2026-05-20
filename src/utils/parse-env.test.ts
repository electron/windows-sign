import { booleanFromEnv } from './parse-env.js';

// Mock the global Jest methods to satisfy TypeScript
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const test: any;

describe('booleanFromEnv', () => {
  // Save the original process.env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset process.env to clean state before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
  });

  test('returns undefined when environment variable is not set', () => {
    const result = booleanFromEnv('NON_EXISTENT_VAR');
    expect(result).toBeUndefined();
  });

  test('returns false for "false" value (case insensitive)', () => {
    process.env.TEST_VAR = 'false';
    expect(booleanFromEnv('TEST_VAR')).toBe(false);

    process.env.TEST_VAR = 'False';
    expect(booleanFromEnv('TEST_VAR')).toBe(false);

    process.env.TEST_VAR = 'FALSE';
    expect(booleanFromEnv('TEST_VAR')).toBe(false);

    process.env.TEST_VAR = 'FaLsE';
    expect(booleanFromEnv('TEST_VAR')).toBe(false);
  });

  test('returns false for "0" value', () => {
    process.env.TEST_VAR = '0';
    expect(booleanFromEnv('TEST_VAR')).toBe(false);
  });

  test('returns true for "true" value', () => {
    process.env.TEST_VAR = 'true';
    expect(booleanFromEnv('TEST_VAR')).toBe(true);
  });

  test('returns true for any non-empty string that is not "false" or "0"', () => {
    process.env.TEST_VAR = '1';
    expect(booleanFromEnv('TEST_VAR')).toBe(true);

    process.env.TEST_VAR = 'yes';
    expect(booleanFromEnv('TEST_VAR')).toBe(true);

    process.env.TEST_VAR = 'on';
    expect(booleanFromEnv('TEST_VAR')).toBe(true);

    process.env.TEST_VAR = 'anything';
    expect(booleanFromEnv('TEST_VAR')).toBe(true);
  });
});