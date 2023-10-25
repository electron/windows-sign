# @electron/osx-sign [![npm][npm_img]][npm_url]

Codesign your app for Windows. Made for [Electron][electron] but really supports any folder with binary files. `electron-windows-sign` scans a folder for binary files (.exe, .msi, .dll, .node) and codesigns them with both SHA-1 and SHA-256. It can be used either programmatically or on the command line. 

## Requirements

By default, this module spawns `signtool.exe` and needs to run on Windows. If you're building an Electron app and care enough to codesign them, I would heavily recommend that you build and test your apps on the platforms you're building for.

## Usage

### As a module
`electron-windows-codesign` is built to both esm and cjs. It supports multiple ways to sign an app:


The short version:
```ts
import { sign } from "electron-windows-sign"
// or const { sign } = require("electron-windows-sign")

sign({ 
  appDirectory: "C:\\Path\\To\\App",
  certificateFile: "C:\\Cert.pfx", // or process.env.WINDOWS_CERTIFICATE_FILE
  certificatePassword: "hunter99"  // or process.env.WINDOWS_CERTIFICATE_PASSWORD
})
  .then(() => console.log("Success!"))
  .catch((error) => console.log(error))
```

The long version:
```ts
import { sign, SignOptions } from "electron-windows-sign"

const options: SignOptions = {
  // Path to the application directory. We will scan this
  // directory for any .dll, .exe, .msi, or .node files and
  // codesign them with signtool.exe
  appDirectory: "C:\\Path\\To\\App",
  // Path to a .pfx code signing certificate. Will use
  // process.env.WINDOWS_CERTIFICATE_FILE if not provided.
  certificateFile: "C:\\Path\\To\\App\\MyCert.pfx",

  // --- Sometimes optional ---

  // Password to said certificate. If you don't provide this,
  // you need to provide a `signWithParams` option. Will use
  // process.env.WINDOWS_CERTIFICATE_PASSWORD if not provided.
  certificatePassword: string,
  
  // --- Options below are optional ---

  // Path to a timestamp server. Defaults to http://timestamp.digicert.com
  timestampServer = "http://timestamp.digicert.com"
  // Description of the signed content. Will be passed to signtool.exe as /d
  description = "My content"
  // URL of the signed content. Will be passed to signtool.exe as /du
  website = "https://mywebsite.com"
  // Path to signtool.exe. Will use vendor/signtool.exe if not provided
  signToolPath = "C:\\Path\\To\\signtool.exe"
  // Additional parameters to pass to signtool.exe.
  signWithParams = ""
  // Enable debug logging
  debug = true;
  // Automatically select the best signing certificate, passed as 
  // /a to signtool.exe, on by default
  automaticallySelectCertificate = true
}

await sign(options)
```

### As a CLI tool

```
SYNOPSIS
  electron-windows-sign app [options ...]

DESCRIPTION
  app
    Path to the application to sign.  It must be a directory.

  certificate-file
    Path to the certificate file (.pfx) to use for signing. Uses 
    environment variable WINDOWS_CERTIFICATE_FILE if not provided.

  certificate-password
    Password to use for the certificate. Uses environment variable
    WINDOWS_CERTIFICATE_PASSWORD if not provided.

  sign-tool-path
    Path to the signtool.exe binary.  If not specified, the tool will attempt
    use a built-in version.

  timestamp-server
    URL of the timestamp server to use.  If not specified, the tool will
    attempt to use a built-in server (http://timestamp.digicert.com)

  description
    Description to use for the signed files. Passed as /d to signtool.exe.

  website
    URL of the website to use for the signed files. Passed as /du to
    signtool.exe.

  sign-with-params
    Additional parameters to pass to signtool.exe.  This can be used to
    specify additional certificates to use for cross-signing.

  automatically-select-certificate
    Automatically select the best certificate to use for signing. On by default.

  help
    Print this usage information.

  debug
    Print additional debug information.
```

# License
BSD 2-Clause "Simplified". Please see LICENSE for details.

[electron]: https://github.com/electron/electron
[electron-windows-sign]: https://github.com/electron-windows-sign
[npm_img]: https://img.shields.io/npm/v/electron-windows-sign.svg
[npm_url]: https://npmjs.org/package/electron-windows-sign
