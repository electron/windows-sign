// SHA-1 has been deprecated on Windows since 2016. We'll still dualsign.
// https://social.technet.microsoft.com/wiki/contents/articles/32288.windows-enforcement-of-sha1-certificates.aspx#Post-February_TwentySeventeen_Plan
export const enum HASHES {
  sha1 = 'sha1',
  sha256 = 'sha256',
}

export interface SignOptions extends OptionalSignToolOptions, OptionalHookOptions {
  // Path to the application directory. We will scan this
  // directory for any .dll, .exe, .msi, or .node files and
  // codesign them with signtool.exe
  appDirectory: string;
}

export interface InternalSignOptions extends SignOptions {
  files: Array<string>;
}

export interface InternalSignToolOptions extends OptionalSignToolOptions, OptionalHookOptions {
  certificateFile?: string;
  certificatePassword?: string;
  signToolPath: string;
  timestampServer: string;
  files: Array<string>;
  hash: HASHES;
  appendSignature?: boolean;
}

export interface OptionalSignToolOptions {
  // Path to a .pfx code signing certificate. Will use
  // process.env.WINDOWS_CERTIFICATE_FILE if not provided
  certificateFile?: string;
  // Password to said certificate. If you don't provide this,
  // you need to provide a `signWithParams` option. Will use
  // process.env.WINDOWS_CERTIFICATE_PASSWORD if not provided
  certificatePassword?: string;
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
  // Should we sign JavaScript files? Defaults to false
  signJavaScript?: boolean
}

export type HookFunction = (fileToSign: string) => Promise<void>;

export interface OptionalHookOptions {
  // A hook function called for each file that needs
  // to be signed.
  hookFunction?: HookFunction;
  // A path to a JavaScript file, exporting a single
  // function that will be called for each file that
  // needs to be signed.
  hookModulePath?: string;
}

export interface InternalHookOptions extends OptionalHookOptions {
  files: Array<string>;
}
