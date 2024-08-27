# Changelog

## NEXT

- BREAKING: Prefix version tags with `v-` for simpler detection of cache control
- BREAKING: Don't emit metadata by default
- Update dependencies

## 1.0.2

- Migrate tests to `node:test`
- Update dependencies

## 1.0.1

- Fix binary

## 1.0.0

- BREAKING: Add `*.json` to default source file patterns
- BREAKING: Rename `manifest` to `metadata` (defaults to `.cbst.json` now)
- BREAKING: Require Node.js >= 20
- Update dependencies

## 0.2.2

- Fix CLI exit code
- Fix `exclude` not excluding some references
- Fix identification of external references

## 0.2.1

- Ignore `mailto:` and other protocols
- Update dependencies

## 0.2.0

- Exit with code 1 on errors (including unresolved references)
- Support source map references
- Fix glob prefix

## 0.1.1

- Fix binary

## 0.1.0

- Initial version
