#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values: args, positionals } = parseArgs({
  options: {
    'certificate-file': { type: 'string' },
    'certificate-password': { type: 'string' },
    'sign-tool-path': { type: 'string' },
    'timestamp-server': { type: 'string' },
    description: { type: 'string' },
    website: { type: 'string' },
    'sign-with-params': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
    debug: { type: 'boolean' },
    'automatically-select-certificate': { type: 'boolean', default: true }
  },
  allowPositionals: true
});
const usage = fs
  .readFileSync(path.join(import.meta.dirname, 'electron-windows-sign-usage.txt'))
  .toString();
const { sign } = await import('../dist/index.js');

args.app = positionals.shift();

if (!args.app || args.help) {
  console.log(usage);
  process.exit(0);
}

// Remove excess arguments
delete args.help;

sign(args, function done(err) {
  if (err) {
    console.error('Sign failed:');
    if (err.message) console.error(err.message);
    else if (err.stack) console.error(err.stack);
    else console.log(err);
    process.exit(1);
  }
  console.log('Application signed:', args.app);
  process.exit(0);
});
