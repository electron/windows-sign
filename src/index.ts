import { sign } from './sign.js';
import { createSeaSignTool, SeaOptions, InternalSeaOptions } from './sea.js';
import { HASHES as HASHES_ENUM } from './types.js';
import {
  HookFunction,
  OptionalHookOptions,
  OptionalSignToolOptions,
  SignOptions,
  SignToolOptions,
  SignOptionsForDirectory,
  SignOptionsForFiles,
} from './types.js';

/**
 * The hash algorithms supported for signing.
 */
export type HASHES = keyof typeof HASHES_ENUM;

export {
  sign,
  SignOptions,
  SignToolOptions,
  HookFunction,
  OptionalSignToolOptions,
  OptionalHookOptions,
  createSeaSignTool,
  SeaOptions,
  InternalSeaOptions,
  SignOptionsForDirectory,
  SignOptionsForFiles,
};
