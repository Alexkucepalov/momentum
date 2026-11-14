# CommonJS security backport

Source: https://registry.npmjs.org/decode-uri-component/-/decode-uri-component-0.5.1.tgz

Upstream implementation is unchanged (one provenance comment is prepended); only `export default function` is converted to `module.exports = function` for Expo Router 57 / query-string 7. The MIT license is included.

Upstream archive SHA-256: `68747a955bbb6a700d758155cf5ff15595c0dfa38504d385abdb249c688bfb15`.

This avoids replacing query-string with an incompatible ESM-only default export. Compatibility checks cover the actual Router CommonJS API and malformed input.
