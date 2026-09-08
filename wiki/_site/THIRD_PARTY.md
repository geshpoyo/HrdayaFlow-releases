# Third-party software (SenPub)

Bundled or build-time dependencies shipped with or used to produce the public site.

## d3 (d3-force, d3-selection, d3-zoom, and related modules)

- Version: 3.x (see `scripts/_vendor-staging/package.json` for pinned versions)
- License: ISC
- Source: vendored under `_site/vendor/` via `_vendor/graph/`

## pixi.js

- Version: 8.9.1
- License: MIT
- Source: vendored under `_site/vendor/` via `_vendor/graph/`

## Pagefind

- Version: 1.5.2
- License: MIT
- Homepage: https://pagefind.app/
- Usage: static full-text search index under `<wiki>/pagefind/` (build-time via `pagefind --site`)
