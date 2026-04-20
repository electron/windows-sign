import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { HookFunction, InternalHookOptions, InternalSignOptions } from './types.js';
import { log } from './utils/log.js';

let hookFunction: HookFunction;

async function getHookFunction(options: InternalHookOptions): Promise<HookFunction> {
  if (options.hookFunction) {
    return options.hookFunction;
  }

  if (options.hookModulePath) {
    const module = await import(pathToFileURL(path.resolve(options.hookModulePath)).toString());

    if (module.default) {
      return module.default;
    }

    if (typeof module === 'function') {
      return module;
    }
  }

  if (!hookFunction) {
    throw new Error(
      'No hook function found. Signing will not be possible. Please see the documentation for how to pass a hook function to @electron/windows-sign',
    );
  }

  return hookFunction;
}

/**
 * Sign with a hook function, basically letting everyone
 * write completely custom sign logic
 *
 * @param {InternalSignOptions} options
 */
export async function signWithHook(options: InternalSignOptions) {
  hookFunction = await getHookFunction(options);

  if (options.noIterateFiles) {
    try {
      await hookFunction(options);
    } catch (error) {
      log('Sign with hook failed.', error);
    }
  } else {
    for (const file of options.files) {
      try {
        await hookFunction(file);
      } catch (error) {
        log(`Error signing ${file}`, error);
      }
    }
  }
}
