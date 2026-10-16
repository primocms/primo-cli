# CLI 0.3.0-rc.1 — draft release candidate

Integrates #64, #65 and #66: stable static-page hydration, refusal of destructive stale two-way imports, and a supported Node boundary of 22.13+ in the 22.x line or 24+. Pins `primo-mcp` exactly to 0.1.11-rc.1, including #29's compiler fix.

The unpublished MCP tarball is retained at `release/vendor/primo-mcp-0.1.11-rc.1.tgz`; package-lock resolves it locally so candidate CI can run `npm ci` without publishing MCP. package.json keeps the exact version contract used by consumers. `npm run build` then `npm pack` produces the normal dist/scripts package; it does not bundle source checkouts or a different compiler.

Install both local MCP and CLI tarballs in the release test kit, using a direct local MCP dependency and an npm override to that dependency. The kit lockfile pins all transitives. Fresh `npm ci --omit=dev` must pass with exactly one MCP candidate and no installed dependency overlays.

This is an integration candidate, not authorization to merge or publish. Before an eventual public release, publish the approved MCP version first and refresh this lockfile to its registry integrity, removing the temporary vendor archive. Repack and rerun the exact-package handoff after any dependency/version change. Review the three focused fixes separately. Make the approved CMS available before the public CLI because normal CLI binary discovery follows the published CMS release.
