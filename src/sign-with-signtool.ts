import path from 'node:path';
import { log } from './utils/log.js';
import { spawnPromise } from './spawn.js';
import { HASHES, InternalSignOptions, InternalSignToolOptions } from './types.js';

/**
 * Tokenizes a `signWithParams` string into an array of arguments, the way a
 * shell would, so the resulting tokens can be passed verbatim to `signtool.exe`
 * (which is spawned without a shell to strip quotes).
 *
 * Tokens are split on whitespace, but double-quoted spans are kept together and
 * the surrounding double-quotes are stripped. This lets values that contain
 * spaces be expressed via quoting, e.g.:
 *
 *   `/n "My Awesome Company"` -> `['/n', 'My Awesome Company']`
 *
 * Behavior:
 * - Unquoted tokens are passed through unchanged.
 * - Runs of whitespace collapse; no empty tokens are produced from gaps.
 * - Leading/trailing whitespace is trimmed.
 * - An explicitly empty quoted value (`""`) yields a single empty-string token.
 *
 * Regression coverage for https://github.com/electron/windows-sign/issues/45
 */
export function parseSignWithParams(input: string): Array<string> {
  const tokens: Array<string> = [];
  let current = '';
  let inToken = false;
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"') {
      // Toggle quote mode. Entering quotes starts a token even if the quoted
      // value is empty (so `""` becomes a single empty-string token).
      inQuotes = !inQuotes;
      inToken = true;
      continue;
    }

    if (!inQuotes && /\s/.test(char)) {
      // Whitespace outside quotes terminates the current token (if any).
      if (inToken) {
        tokens.push(current);
        current = '';
        inToken = false;
      }
      continue;
    }

    current += char;
    inToken = true;
  }

  if (inToken) {
    tokens.push(current);
  }

  return tokens;
}

export function getSigntoolArgs(options: InternalSignToolOptions) {
  // See the following url for docs
  // https://learn.microsoft.com/en-us/dotnet/framework/tools/signtool-exe
  const { certificateFile, certificatePassword, hash, timestampServer } = options;
  const args = ['sign'];

  // Parse signWithParams up front so we can avoid appending defaults for any
  // flag the user already supplied. Passing e.g. /tr or /fd twice makes
  // signtool.exe error on the duplicate. See issue #46.
  let extraArgs: Array<string> = [];
  if (options.signWithParams) {
    if (Array.isArray(options.signWithParams)) {
      // The array form is a verbatim passthrough - each entry is already a
      // discrete argument, so we must not re-parse or strip quotes from it.
      extraArgs = [...options.signWithParams];
    } else {
      // Split up at spaces, keeping double-quoted spans together and stripping
      // the surrounding quotes (see parseSignWithParams).
      extraArgs = parseSignWithParams(options.signWithParams);
    }
    log('Parsed signWithParams as:', extraArgs);
  }

  const hasUserFlag = (flag: string) => extraArgs.includes(flag);

  // Automatically select cert
  if (options.automaticallySelectCertificate) {
    args.push('/a');
  }

  // Dual-sign
  if (options.appendSignature) {
    args.push('/as');
  }

  // Timestamp
  if (hash === HASHES.sha256) {
    if (!hasUserFlag('/tr')) {
      args.push('/tr', timestampServer);
    }
    if (!hasUserFlag('/td')) {
      args.push('/td', hash);
    }
  } else {
    args.push('/t', timestampServer);
  }

  // Certificate file
  if (certificateFile) {
    args.push('/f', path.resolve(certificateFile));
  }

  // Certificate password
  if (certificatePassword) {
    args.push('/p', certificatePassword);
  }

  // Hash
  if (!hasUserFlag('/fd')) {
    args.push('/fd', hash);
  }

  // Description
  if (options.description) {
    args.push('/d', options.description);
  }

  // Website
  if (options.website) {
    args.push('/du', options.website);
  }

  // Debug
  if (options.debug) {
    args.push('/debug');
  }

  if (extraArgs.length > 0) {
    args.push(...extraArgs);
  }

  return args;
}

async function execute(options: InternalSignToolOptions) {
  const { signToolPath, files } = options;
  const args = getSigntoolArgs(options);

  log('Executing signtool with args', { args, files });
  const { code, stderr, stdout } = await spawnPromise(signToolPath, [...args, ...files], {
    env: process.env,
    cwd: process.cwd(),
  });

  if (code !== 0) {
    throw new Error(`Signtool exited with code ${code}.\nArgs: ${args.join(' ')}\nStderr: ${stderr}.\nStdout: ${stdout}`);
  }
}

export async function signWithSignTool(options: InternalSignOptions) {
  const certificatePassword =
    options.certificatePassword || process.env.WINDOWS_CERTIFICATE_PASSWORD;
  const certificateFile = options.certificateFile || process.env.WINDOWS_CERTIFICATE_FILE;
  const signWithParams = options.signWithParams || process.env.WINDOWS_SIGN_WITH_PARAMS;
  const timestampServer =
    options.timestampServer ||
    process.env.WINDOWS_TIMESTAMP_SERVER ||
    'http://timestamp.digicert.com';
  const signToolPath =
    options.signToolPath ||
    process.env.WINDOWS_SIGNTOOL_PATH ||
    path.join(import.meta.dirname, '../vendor/signtool.exe');
  const description = options.description || process.env.WINDOWS_SIGN_DESCRIPTION;
  const website = options.website || process.env.WINDOWS_SIGN_WEBSITE;

  if (!certificateFile && !(signWithParams || signToolPath)) {
    throw new Error('You must provide a certificateFile and a signToolPath or signing parameters');
  }

  if (!signToolPath && !signWithParams && !certificatePassword) {
    throw new Error('You must provide a certificatePassword or signing parameters');
  }

  const internalOptions = {
    appendSignature: false,
    ...options,
    certificateFile,
    certificatePassword,
    signWithParams,
    signToolPath,
    description,
    timestampServer,
    website,
  };

  const hashes =
    options.hashes == null || options.hashes.length === 0
      ? [HASHES.sha1, HASHES.sha256]
      : options.hashes;

  if (hashes.includes(HASHES.sha1)) {
    await execute({ ...internalOptions, hash: HASHES.sha1 });
    // If we signed with SHA1, we need to append the SHA256 signature:
    internalOptions.appendSignature = true;
  }
  if (hashes.includes(HASHES.sha256)) {
    await execute({ ...internalOptions, hash: HASHES.sha256 });
  }
}
