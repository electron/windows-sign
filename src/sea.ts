import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import postject from 'postject';

import { spawnPromise } from './spawn';
import { log } from './utils/log';
import { SignToolOptions } from './types';

interface SeaOptions {
  // Full path to the sea. Needs to end with .exe
  path: string
  // Optional: A binary to use. Will use the current executable
  // (process.execPath) by default.
  bin?: string;
  // Sign options
  windowsSign: SignToolOptions
}

interface InternalSeaOptions extends Required<SeaOptions> {
  dir: string
  filename: string
}

const FILENAMES = {
  SEA_CONFIG: 'sea-config.json',
  SEA_MAIN: 'sea.js',
  SEA_BLOB: 'sea.blob',
  SEA_RECEIVER: 'receiver.cjs'
};

const SEA_MAIN_SCRIPT = `
const bin = "%PATH_TO_BIN%";
const script = "%PATH_TO_SCRIPT%";
const options = JSON.parse(\`
%WINDOWS_SIGN_OPTIONS%
\`.trim())

const { spawnSync } = require('child_process');

function main() {
  console.log("@electron/windows-sign sea");
  console.log({ bin, script });

  try {
    const spawn = spawnSync(
      bin,
      [ script, JSON.stringify(options), JSON.stringify(process.argv.slice(1)) ],
      { stdio: ['inherit', 'inherit', 'pipe'] }
    );

    const stderr = spawn.stderr.toString().trim();

    if (stderr) {
      throw new Error(stderr);
    }
  } catch (error) {
    process.exitCode = 1;
    throw new Error(error);
  }
}

main();
`;

const SEA_RECEIVER_SCRIPT = `
const { sign } = require('@electron/windows-sign');
const fs = require('fs-extra');
const path = require('path');

const logPath = path.join(__dirname, 'windows-sign-log.txt');
const options = JSON.parse(process.argv[2]);
const signArgv = JSON.parse(process.argv[3]);
const files = signArgv.slice(-1);

fs.appendFileSync(logPath, \`\\n\${files}\`);
sign({ ...options, files })
  .then((result) => {
    fs.appendFileSync(logPath, \`\\n\${result}\`);
    console.log(\`Successfully signed \${files}\`, result);
  })
  .catch((error) => {
    fs.appendFileSync(logPath, \`\\n\${error}\`);
    throw new Error(error);
  });
`;

/**
 * Uses Node's "Single Executable App" functionality
 * to create a Node-driven signtool.exe that calls this
 * module.
 *
 * This is useful with other tooling that _always_ calls
 * a signtool.exe to sign. Some of those tools cannot be
 * easily configured, but we _can_ override their signtool.exe.
 */
export async function createSeaSignTool(options: Partial<SeaOptions> = {}): Promise<InternalSeaOptions> {
  checkCompatibility();

  const requiredOptions = await getOptions(options);
  await createFiles(requiredOptions);
  await createBlob(requiredOptions);
  await createBinary(requiredOptions);
  await createSeaReceiver(requiredOptions);
  await cleanup(requiredOptions);

  return requiredOptions;
}

async function createSeaReceiver(options: InternalSeaOptions) {
  const receiverPath = path.join(options.dir, FILENAMES.SEA_RECEIVER);

  await fs.ensureFile(receiverPath);
  await fs.writeFile(receiverPath, SEA_RECEIVER_SCRIPT);
}

async function createFiles(options: InternalSeaOptions) {
  const { dir, bin } = options;
  const receiverPath = path.join(options.dir, FILENAMES.SEA_RECEIVER);

  // sea-config.json
  await fs.outputJSON(path.join(dir, FILENAMES.SEA_CONFIG), {
    main: FILENAMES.SEA_MAIN,
    output: FILENAMES.SEA_BLOB,
    disableExperimentalSEAWarning: true
  }, {
    spaces: 2
  });

  // signtool.js
  const binPath = bin || process.execPath;
  const script = SEA_MAIN_SCRIPT
    .replace('%PATH_TO_BIN%', escapeMaybe(binPath))
    .replace('%PATH_TO_SCRIPT%', escapeMaybe(receiverPath))
    .replace('%WINDOWS_SIGN_OPTIONS%', JSON.stringify(options.windowsSign));

  await fs.outputFile(path.join(dir, FILENAMES.SEA_MAIN), script);
}

async function createBlob(options: InternalSeaOptions) {
  const args = ['--experimental-sea-config', 'sea-config.json'];
  const bin = process.execPath;
  const cwd = options.dir;

  log(`Calling ${bin} with options:`, args);

  return spawnPromise(bin, args, {
    cwd
  });
}

async function createBinary(options: InternalSeaOptions) {
  const { dir, filename } = options;

  log(`Creating ${filename} in ${dir}`);

  // Copy Node over
  const seaPath = path.join(dir, filename);
  await fs.copyFile(process.execPath, seaPath);

  // Remove the Node signature
  const signtool = path.join(__dirname, '../../vendor/signtool.exe');
  await spawnPromise(signtool, [
    'remove',
    '/s',
    seaPath
  ]);

  // Inject the blob
  const blob = await fs.readFile(path.join(dir, FILENAMES.SEA_BLOB));
  await postject.inject(seaPath, 'NODE_SEA_BLOB', blob, {
    sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'
  });
}

async function cleanup(options: InternalSeaOptions) {
  const { dir } = options;
  const toRemove = [
    FILENAMES.SEA_BLOB,
    FILENAMES.SEA_MAIN,
    FILENAMES.SEA_CONFIG
  ];

  for (const file of toRemove) {
    try {
      await fs.remove(path.join(dir, file));
    } catch (error) {
      console.warn(`Tried and failed to remove ${file}. Continuing.`, error);
    }
  }
}

async function getOptions(options: Partial<SeaOptions>): Promise<InternalSeaOptions> {
  const cloned = { ...options };

  if (!cloned.path) {
    cloned.path = path.join(os.homedir(), '.electron', 'windows-sign', 'sea.exe');
    await fs.mkdirp(cloned.path);
  }

  if (!cloned.bin) {
    cloned.bin = process.execPath;
  }

  if (!cloned.windowsSign) {
    throw new Error('Did not find windowsSign options, which are required');
  }

  return {
    path: cloned.path,
    dir: path.dirname(cloned.path),
    filename: path.basename(cloned.path),
    bin: cloned.bin,
    windowsSign: cloned.windowsSign
  };
}

/**
 * Ensures that the current Node.js version supports SEA app generation and errors if not.
 */
function checkCompatibility() {
  const version = process.versions.node;
  const split = version.split('.');
  const major = parseInt(split[0], 10);
  const minor = parseInt(split[1], 10);

  if (major >= 20) {
    return true;
  }

  if (major === 19 && minor >= 7) {
    return true;
  }

  if (major === 18 && minor >= 16) {
    return true;
  }

  throw new Error(`Your Node.js version (${process.version}) does not support Single Executable Applications. Please upgrade your version of Node.js.`);
}

/** Make sure that the input string has escaped backwards slashes
 * - but never double-escaped backwards slashes.
 */
function escapeMaybe(input: string): string {
  const result = input.split(path.sep).join('\\\\');

  if (result.includes('\\\\\\\\')) {
    throw new Error(`Your passed input ${input} contains escaped slashes. Please do not escape them`);
  }

  return result;
}
