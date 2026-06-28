import assert from 'node:assert';
import { describe, it } from 'node:test';

import { getSigntoolArgs, parseSignWithParams } from '../src/sign-with-signtool.js';
import { HASHES, InternalSignToolOptions } from '../src/types.js';

void describe('parseSignWithParams', async () => {
  // Regression test for https://github.com/electron/windows-sign/issues/45:
  // surrounding double-quotes must be stripped from parsed tokens, otherwise
  // signtool.exe (spawned without a shell) receives the literal quotes and fails.
  void it('strips surrounding double-quotes (issue #45 regression)', () => {
    assert.deepStrictEqual(parseSignWithParams('/n "My Awesome Company"'), [
      '/n',
      'My Awesome Company',
    ]);
  });

  void it('parses the README DigiCert example into the exact expected argv', () => {
    const input =
      '/csp "DigiCert Signing Manager KSP" /kc <keypair_alias> /f <certificate_file> /tr http://timestamp.digicert.com /td SHA256 /fd SHA256';

    assert.deepStrictEqual(parseSignWithParams(input), [
      '/csp',
      'DigiCert Signing Manager KSP',
      '/kc',
      '<keypair_alias>',
      '/f',
      '<certificate_file>',
      '/tr',
      'http://timestamp.digicert.com',
      '/td',
      'SHA256',
      '/fd',
      'SHA256',
    ]);
  });

  void it('strips quotes for the Google Cloud KMS provider case', () => {
    assert.deepStrictEqual(parseSignWithParams('/csp "Google Cloud KMS Provider"'), [
      '/csp',
      'Google Cloud KMS Provider',
    ]);
  });

  void it('passes through plain unquoted strings unchanged', () => {
    assert.deepStrictEqual(parseSignWithParams('--my=custom --parameters'), [
      '--my=custom',
      '--parameters',
    ]);
  });

  void it('handles mixed quoted and unquoted tokens in one string', () => {
    assert.deepStrictEqual(parseSignWithParams('/a /n "My Awesome Company" /fd sha256'), [
      '/a',
      '/n',
      'My Awesome Company',
      '/fd',
      'sha256',
    ]);
  });

  void it('collapses multiple consecutive spaces and produces no empty tokens', () => {
    assert.deepStrictEqual(parseSignWithParams('/n    "My Awesome Company"     /a'), [
      '/n',
      'My Awesome Company',
      '/a',
    ]);
  });

  void it('trims leading and trailing whitespace', () => {
    assert.deepStrictEqual(parseSignWithParams('   /a /b   '), ['/a', '/b']);
  });

  void it('treats an empty quoted value as a single empty-string token', () => {
    assert.deepStrictEqual(parseSignWithParams('/d ""'), ['/d', '']);
  });

  void it('returns an empty array for an empty or whitespace-only string', () => {
    assert.deepStrictEqual(parseSignWithParams(''), []);
    assert.deepStrictEqual(parseSignWithParams('   '), []);
  });

  void it('keeps a quoted value with multiple internal spaces intact', () => {
    assert.deepStrictEqual(parseSignWithParams('/d "a  b   c"'), ['/d', 'a  b   c']);
  });
});

void describe('getSigntoolArgs signWithParams handling', async () => {
  const baseOptions: InternalSignToolOptions = {
    signToolPath: 'signtool.exe',
    timestampServer: 'http://timestamp.digicert.com',
    files: ['my/fake/file.exe'],
    hash: HASHES.sha256,
  };

  void it('strips quotes from a string signWithParams (issue #45)', () => {
    const args = getSigntoolArgs({
      ...baseOptions,
      signWithParams: '/csp "DigiCert Signing Manager KSP" /kc alias',
    });

    // The parsed extra args are appended last.
    assert.deepStrictEqual(args.slice(-4), [
      '/csp',
      'DigiCert Signing Manager KSP',
      '/kc',
      'alias',
    ]);
    assert.ok(!args.includes('"DigiCert Signing Manager KSP"'));
  });

  void it('passes the array form through verbatim without re-parsing or stripping quotes', () => {
    // An array entry that itself contains quotes/spaces must stay intact.
    const verbatim = ['/csp', 'DigiCert Signing Manager KSP', '/literal', '"keep these quotes"'];
    const args = getSigntoolArgs({
      ...baseOptions,
      signWithParams: verbatim,
    });

    assert.deepStrictEqual(args.slice(-verbatim.length), verbatim);
  });
});
