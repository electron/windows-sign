import path from 'path';
import fs from 'fs-extra';
import { enableDebugging, log } from './utils';
import { spawnPromise } from './spawn';

// SHA-1 has been deprecated on Windows since 2016. We'll still dualsign.
// https://social.technet.microsoft.com/wiki/contents/articles/32288.windows-enforcement-of-sha1-certificates.aspx#Post-February_TwentySeventeen_Plan
const enum HASHES {
  sha1 = 'sha1',
  sha256 = 'sha256',
}

export interface SignOptions extends OptionalSignOptions {
  // Path to the application directory. We will scan this
  // directory for any .dll, .exe, .msi, or .node files and
  // codesign them with signtool.exe
  appDirectory: string;
  // Path to a .pfx code signing certificate. Will use
  // process.env.WINDOWS_CERTIFICATE_FILE if not provided
  certificateFile?: string;
  // Password to said certificate. If you don't provide this,
  // you need to provide a `signWithParams` option. Will use
  // process.env.WINDOWS_CERTIFICATE_PASSWORD if not provided
  certificatePassword?: string;
}

interface InternalOptions extends OptionalSignOptions {
  certificateFile: string;
  certificatePassword?: string;
  signToolPath: string;
  timestampServer: string;
  files: Array<string>;
  hash: HASHES;
  appendSignature?: boolean;
}

interface OptionalSignOptions {
  // Path to a timestamp server. Defaults to http://timestamp.digicert.com
  timestampServer?: string;
  // Description of the signed content. Will be passed to signtool.exe as /d
  description?: string;
  // URL of the signed content. Will be passed to signtool.exe as /du
  website?: string;
  // Path to signtool.exe. Will use vendor/signtool.exe if not provided
  signToolPath?: string;
  // Additional parameters to pass to signtool.exe.
  signWithParams?: string;
  // Enable debug logging
  debug?: boolean;
  // Automatically select the best signing certificate, passed as
  // /a to signtool.exe, on by default
  automaticallySelectCertificate?: boolean;
}

function getSigntoolArgs(options: InternalOptions) {
  // See the following url for docs
  // https://learn.microsoft.com/en-us/dotnet/framework/tools/signtool-exe
  const { certificateFile, certificatePassword, hash, timestampServer } = options;
  const args = ['sign'];

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
    args.push('/tr', timestampServer);
    args.push('/td', hash);
  } else {
    args.push('/t', timestampServer);
  }

  // Certificate file
  args.push('/f', path.resolve(certificateFile));

  // Certificate password
  if (certificatePassword) {
    args.push('/p', certificatePassword);
  }

  // Hash
  args.push('/fd', hash);

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

  if (options.signWithParams) {
    // Split up at spaces and doublequotes
    const extraArgs = options.signWithParams.match(/(?:[^\s"]+|"[^"]*")+/g) as Array<string>;
    args.push(...extraArgs);
  }

  return args;
}

const IS_BINARY_REGEX = /\.(exe|msi|dll|node)$/i;
function getFilesToSign(dir: string) {
  // Array of file paths to sign
  const result: Array<string> = [];

  // Iterate over the app directory, looking for files to sign
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.resolve(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      // If it's a directory, recurse
      result.push(...getFilesToSign(fullPath));
    } else if (IS_BINARY_REGEX.test(file)) {
      // If it's a binary, add it to the list
      result.push(fullPath);
    }
  }

  return result;
}

async function execute(options: InternalOptions) {
  const { signToolPath, files } = options;
  const args = getSigntoolArgs(options);

  log('Executing signtool with args', { args, files });
  const { code, stderr, stdout } = await spawnPromise(signToolPath, [...args, ...files], {
    env: process.env,
    cwd: process.cwd()
  });

  if (code !== 0) {
    throw new Error(`Signtool exited with code ${code}. Stderr: ${stderr}. Stdout: ${stdout}`);
  }
}

export async function sign(options: SignOptions) {
  const certificatePassword = options.certificatePassword || process.env.WINDOWS_CERTIFICATE_PASSWORD;
  const certificateFile = options.certificateFile || process.env.WINDOWS_CERTIFICATE_FILE;
  const signWithParams = options.signWithParams || process.env.WINDOWS_SIGN_WITH_PARAMS;
  const timestampServer = options.timestampServer || process.env.WINDOWS_TIMESTAMP_SERVER || 'http://timestamp.digicert.com';
  const signToolPath = options.signToolPath || process.env.WINDOWS_SIGNTOOL || path.join(__dirname, '../../vendor/signtool.exe');

  if (options.debug) {
    enableDebugging();
  }

  log('electron-windows-codesign called with options', { options });

  if (!certificateFile) {
    throw new Error('You must provide a certificateFile');
  }

  if (!signWithParams && !certificatePassword) {
    throw new Error('You must provide a certificatePassword or signing parameters');
  }

  const files = getFilesToSign(options.appDirectory);

  const internalOptions = {
    ...options,
    certificateFile,
    certificatePassword,
    signWithParams,
    signToolPath,
    timestampServer,
    files
  };

  await execute({ ...internalOptions, hash: HASHES.sha1 });
  await execute({ ...internalOptions, hash: HASHES.sha256, appendSignature: true });
}
