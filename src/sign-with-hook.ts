import { HookFunction, InternalHookOptions, InternalSignOptions } from './types';
import { log } from './utils/log';

let hookFunction: HookFunction;

function getHookFunction(options: InternalHookOptions): HookFunction {
  if (options.hookFunction) {
    return options.hookFunction;
  }

  if (options.hookModulePath) {
    const module = require(options.hookModulePath);

    if (module.default) {
      return module.default;
    }

    if (typeof module === 'function') {
      return module;
    }
  }

  if (!hookFunction) {
    throw new Error('No hook function found. Signing will not be possible. Please see the documentation for how to pass a hook function to @electron/windows-sign');
  }

  return hookFunction;
}

export async function signWithHook(options: InternalSignOptions) {
  if (!hookFunction) {
    hookFunction = getHookFunction(options);
  }

  for (const file of options.files) {
    try {
      await hookFunction(file);
    } catch (error) {
      log(`Error signing ${file}`, error);
    }
  }
}
