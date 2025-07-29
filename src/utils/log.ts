import debug from 'debug';

export function enableDebugging() {
  debug.enable('electron-windows-sign');
}

export const log = debug('electron-windows-sign');
