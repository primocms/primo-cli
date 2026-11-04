# CLI 0.3.0-rc.2 — draft release candidate

Integrates #64, #65 and #66: stable static-page hydration, refusal of destructive stale two-way imports, and a supported Node boundary of 22.13+ in the 22.x line or 24+. Pins `primo-mcp` exactly to 0.1.11-rc.2, including #29's compiler fix.

The unpublished MCP tarball is retained at `release/vendor/primo-mcp-0.1.11-rc.2.tgz`; package-lock resolves it locally so candidate CI can run `npm ci` without publishing MCP. package.json keeps the exact version contract used by consumers. `npm run build` then `npm pack` produces the normal dist/scripts package; it does not bundle source checkouts or a different compiler.

Install both local MCP and CLI tarballs in the release test kit, using a direct local MCP dependency and an npm override to that dependency. The kit lockfile pins all transitives. Fresh `npm ci --omit=dev` must pass with exactly one MCP candidate and no installed dependency overlays.

This is an integration candidate, not authorization to merge or publish. Before an eventual public release, publish the approved MCP version first and refresh this lockfile to its registry integrity, removing the temporary vendor archive. Repack and rerun the exact-package handoff after any dependency/version change. Review the three focused fixes separately. Make the approved CMS available before the public CLI because normal CLI binary discovery follows the published CMS release.

RC.2 removes vulnerable archive extraction, rejects unsafe ZIP paths/types before writing, upgrades the file watcher, and refreshes patched dependencies. No publication authorized.


## Review follow-up — source qualification pending

The release source now includes the reviewed upload, log, extraction, shared-field and startup-conflict fixes. The published RC.3 archives and held stable archives remain historical; source changes do not update those immutable bytes. Rebuild/package new candidates and refresh checksums and exact-package qualification before promotion.

CLI CI executes `npm test` on Node 22.13/24.0. The real-CMS tests (`tests/import-upload-cms.test.mjs`, `tests/site-field-publish-cms.test.mjs`, push/publish and upload round trips) run in the coordinated CMS native/downstream gate on release PR #1363; they require `PRIMO_TEST_CMS_BINARY`. Local review validation also runs these tests against the retained qualified CMS executable.

New archive dependency advisories GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249 require patched glob 14.0.2 and minimatch 11.0.1. Exact npm overrides retain the existing archiver API while replacing those transitives. Do not suppress the audit or relax its threshold; archive behavior, proxy imports and supported runtimes must still pass.
