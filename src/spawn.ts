import { SpawnOptions } from 'node:child_process';
import { log } from './utils/log.js';

export interface SpawnPromiseResult {
  stdout: string;
  stderr: string;
  code: number;
}

/**
 * Spawn a process as a promise
 *
 * @param {string} name
 * @param {Array<string>} args
 * @param {SpawnOptions} [options]
 * @returns {Promise<SpawnPromiseResult>}
 */
export async function spawnPromise(
  name: string,
  args: Array<string>,
  options: SpawnOptions = {},
): Promise<SpawnPromiseResult> {
  const { spawn } = await import('node:child_process');
  const fork = spawn(name, args, options);

  log(`Spawning ${name} with ${args}`);

  let stdout = '';
  let stderr = '';

  return new Promise((resolve) => {
    fork.stdout?.on('data', (data: any) => {
      log(`Spawn ${name} stdout: ${data}`);
      stdout += data;
    });

    fork.stderr?.on('data', (data: any) => {
      log(`Spawn ${name} stderr: ${data}`);
      stderr += data;
    });

    fork.on('close', (code: number) => {
      log(`Spawn ${name}: Child process exited with code ${code}`);
      resolve({ stdout, stderr, code });
    });
  });
}
