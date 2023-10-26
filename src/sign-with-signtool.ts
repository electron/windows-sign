import path from 'path';
import { enableDebugging, log } from './utils';
import { spawnPromise } from './spawn';
import { getFilesToSign } from './files';
import { HASHES, InternalOptions, SignOptions } from './types';
import { booleanFromEnv } from './utils/parse-env';

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

export async function signWithSignTool(options: SignOptions) {
  const certificatePassword = options.certificatePassword || process.env.WINDOWS_CERTIFICATE_PASSWORD;
  const certificateFile = options.certificateFile || process.env.WINDOWS_CERTIFICATE_FILE;
  const signWithParams = options.signWithParams || process.env.WINDOWS_SIGN_WITH_PARAMS;
  const timestampServer = options.timestampServer || process.env.WINDOWS_TIMESTAMP_SERVER || 'http://timestamp.digicert.com';
  const signToolPath = options.signToolPath || process.env.WINDOWS_SIGNTOOL_PATH || path.join(__dirname, '../../vendor/signtool.exe');
  const description = options.description || process.env.WINDOWS_SIGN_DESCRIPTION;
  const website = options.website || process.env.WINDOWS_SIGN_WEBSITE;
  const signJavaScript = options.signJavaScript || booleanFromEnv('WINDOWS_SIGN_JAVASCRIPT');

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

  const files = getFilesToSign(options);

  const internalOptions = {
    ...options,
    certificateFile,
    certificatePassword,
    signWithParams,
    signToolPath,
    description,
    timestampServer,
    website,
    signJavaScript,
    files
  };

  await execute({ ...internalOptions, hash: HASHES.sha1 });
  await execute({ ...internalOptions, hash: HASHES.sha256, appendSignature: true });
}
