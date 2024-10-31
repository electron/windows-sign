# @electron/windows-sign [![npm][npm_img]][npm_url]

Codesign your app for Windows. Made for [Electron][electron] but really supports any folder with binary files. `electron-windows-sign` scans a folder for [signable files](#file-types) and codesigns them with both SHA-1 and SHA-256. It can be highly customized and used either programmatically or on the command line. 

This tool is particularly useful if you want to code sign Electron or other Windows binaries with an EV certificate or an HSM setup (like DigiCert KeyLocker, AWS CloudHSM, Azure Key Vault HSM, Google Cloud Key Management Service HSM, and other similar services). For more details on how you'd exactly do that, please see [Use with Cloud HSM Providers](#use-with-cloud-hsm-providers) below.

# Requirements

By default, this module spawns `signtool.exe` and needs to run on Windows. If you're building an Electron app and care enough to codesign them, I would heavily recommend that you build and test your apps on the platforms you're building for.

# Usage

Most developers of Electron apps will likely not use this module directly - and instead use it indirectly
instead. If you are one of those developers who is using a module like `@electron/forge` or `@electron/packager`, you can configure this module with global environment variables. If that describes
you, you can skip ahead to your use case:

 - [With a certificate file and password](#with-a-certificate-file-and-password)
 - [With a custom binary or custom parameters](#with-a-custom-signtoolexe-or-custom-parameters)
 - [With a completely custom hook](#with-a-custom-hook-function)

## Direct Usage

`@electron/windows-codesign` is built to both esm and cjs and can be used both as a module as well as directly from the command line.

```ts
import { sign } from "@electron/windows-sign"
// or const { sign } = require("@electron/windows-sign")

await sign(signOptions)
```

```ps1
electron-windows-sign $PATH_TO_APP_DIRECTORY [options ...]
```

## With a certificate file and password

This is the "traditional" way to codesign Electron apps on Windows. You pass in a certificate file
(like a .pfx) and a password, which will then be passed to a built-in version of `signtool.exe` taken
directly from the Windows SDK. 

```ts
await sign({
  appDirectory: "C:\\Path\\To\\App",
  // or process.env.WINDOWS_CERTIFICATE_FILE
  certificateFile: "C:\\Cert.pfx",
  // or process.env.WINDOWS_CERTIFICATE_PASSWORD 
  certificatePassword: "hunter99"
})
```

```ps1
electron-windows-sign $PATH_TO_APP_DIRECTORY --certificate-file=$PATH_TO_CERT --certificate-password=$CERT-PASSWORD
```

### Full configuration
```ts
// Path to a timestamp server. Defaults to http://timestamp.digicert.com
// Can also be passed as process.env.WINDOWS_TIMESTAMP_SERVER
timestampServer = "http://timestamp.digicert.com"
// Description of the signed content. Will be passed to signtool.exe as /d
// Can also be passed as process.env.WINDOWS_SIGN_DESCRIPTION
description = "My content"
// URL of the signed content. Will be passed to signtool.exe as /du
// Can also be passed as process.env.WINDOWS_SIGN_WEBSITE
website = "https://mywebsite.com"
// If enabled, attempt to sign .js JavaScript files. Disabled by default
signJavaScript = true
// If unspecified, both sha1 and sha256 signatures will be appended. Will be passed to signtool.exe as the /fd option.
hashes = ["sha256"]
```

## With a custom signtool.exe or custom parameters

Sometimes, you need to specify specific signing parameters or use a different version
of `signtool.exe`. In this mode, `@electron/windows-sign` will call the provided binary
with the provided parameters for each file to sign. 

If you only provide `signToolPath`, the default parameters will be used.
If you only provide `signWithParams`, the default `signtool.exe` will be used. 

All the [additional configuration](#additional-configuration) mentioned above is also
available here, but only used if you do not provide your own parameters.

```ts
await sign({
  appDirectory: "C:\\Path\\To\\App",
  // or process.env.WINDOWS_CERTIFICATE_FILE
  certificateFile: "C:\\Cert.pfx", 
  // or process.env.WINDOWS_CERTIFICATE_PASSWORD
  certificatePassword: "hunter99",
  // or process.env.WINDOWS_SIGNTOOL_PATH
  signToolPath: "C:\\Path\\To\\my-custom-tool.exe",
  // or process.env.WINDOWS_SIGN_WITH_PARAMS
  signWithParams: "--my=custom --parameters"
})
```

```ps1
electron-windows-sign $PATH_TO_APP_DIRECTORY --sign-tool-path=$PATH_TO_TOOL --sign-with-params="--my=custom --parameters"
```

## With a custom hook function

Sometimes, you just want all modules depending on `@electron/windows-sign` to call
your completely custom logic. You can either specify a `hookFunction` (if you're calling
this module yourself) or a `hookModulePath`, which this module will attempt to require.

Using the `hookModulePath` has the benefit that you can override how any other users
of this module (like `@electron/packager`) codesign your app.

```ts
await sign({
  // A function with the following signature:
  // (fileToSign: string) => void | Promise<void>
  //
  // This function will be called sequentially for each file that 
  // @electron/windows-sign wants to sign.
  hookFunction: myHookFunction
  // Path to a hook module.
  hookModulePath: "C:\\Path\\To\\my-hook-module.js",
})
```

Your hook module should either directly export a function or
export a `default` function.
```js
// Good:
module.exports = function (filePath) {
  console.log(`Path to file to sign: ${filePath}`)
}

// Good:
module.exports = async function (filePath) {
  console.log(`Path to file to sign: ${filePath}`)
}

// Good:
export default async function (filePath) {
  console.log(`Path to file to sign: ${filePath}`)
}

// Bad:
module.exports = {
  myCustomHookName: function (filePath) {
    console.log(`Path to file to sign: ${filePath}`)
  }
}

// Bad:
export async function myCustomHookName(filePath) {
  console.log(`Path to file to sign: ${filePath}`)
}
```

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

# File Types
This tool will aggressively attempt to sign all files that _can_
be signed, excluding scripts.

- [Portable executable files][pe] (.exe, .dll, .sys, .efi, .scr, .node)
- Microsoft installers (.msi)
- APPX/MSIX packages (.appx, .appxbundle, .msix, .msixbundle)
- Catalog files (.cat)
- Cabinet files (.cab)
- Silverlight applications (.xap)
- Scripts (.vbs, .wsf, .ps1)

If you do want to sign JavaScript, please enable it with the `signJavaScript`
parameter. As far as we are aware, there are no benefits to signing
JavaScript files, so we do not by default.

# Use with Cloud HSM Providers

Since 2023, Microsoft requires that Windows software be signed with an extended validation (EV) certificate in order to avoid a Windows Defender popup. This presents a challenge for developers who are used to building and signing in the cloud or some continuous integration setup like GitHub Actions, CircleCI, Travis CI, or AppVeyor because EV certificates require a Hardware Security Module (HSM). Or, in simpler words: If you want to code sign your Windows software so that your customers don't see a scary Windows Defender dialog, you need to code sign on a computer with a USB device plugged in. 

The industry has an answer to this problem: Services like DigiCert KeyLocker, AWS CloudHSM, Azure Key Vault HSM, or Google Cloud Key Management Service HSM allow code signing binaries with an Extended Validation (EV) certificate from the cloud. `@electron/windows-sign` is compatible with all of these services. 

## Custom signtool parameters

Most services allow signing your code with Microsoft's `signtool.exe`. Let's take DigiCert KeyLocker as an example. [DigiCert's documentation](https://docs.digicert.com/en/digicert-keylocker/signing-tools/sign-authenticode-files-with-signtool-on-windows.html) explains the steps necessary to setup your signing machine. Once done, you can sign with the following call:

```
signtool.exe sign /csp "DigiCert Signing Manager KSP" /kc <keypair_alias> /f <certificate_file> /tr http://timestamp.digicert.com /td SHA256 /fd SHA256 <file_to_be_signed> 
```

To sign with `@electron/windows-sign` using those instructions, you would take the parameters and add them to `signWithParams`:

```js
await sign({
  signWithParams: "/csp \"DigiCert Signing Manager KSP\" /kc <keypair_alias> /f <certificate_file> /tr http://timestamp.digicert.com /td SHA256 /fd SHA256"
})
```

Both Google's and Amazon's solutions similarly allow you to sign with Microsoft's SignTool. Documentation for [Google can be found here](https://cloud.google.com/kms/docs/reference/cng-signtool), [Amazon's lives here](https://docs.aws.amazon.com/cloudhsm/latest/userguide/signtool.html). 

## Custom signtool.exe

Some providers provide drop-in replacements for `signtool.exe`. If that's the case, simply pass the path to that replacement:

```ts
await sign({
  // or process.env.WINDOWS_SIGNTOOL_PATH
  signToolPath: "C:\\Path\\To\\my-custom-tool.exe",
})
```

## Fully custom process

If your HSM provider has a more complex setup, you might have to call a custom file with custom parameters. If that's the case, use a hook function or hook module, which allows you to completely customize what to do with each file that `@electron/windows-sign` wants to sign. More documentation about this option can be found in the ["Signing with a custom hook function" section above](#with-a-custom-hook-function).

# License
BSD 2-Clause "Simplified". Please see LICENSE for details.

[electron]: https://github.com/electron/electron
[npm_img]: https://img.shields.io/npm/v/@electron/windows-sign.svg
[npm_url]: https://npmjs.org/package/@electron/windows-sign
[pe]: https://en.wikipedia.org/wiki/Portable_Executable
