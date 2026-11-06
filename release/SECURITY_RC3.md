# CLI security candidate RC.3

primo-cli 0.3.0-rc.3 keeps the frozen release behavior and updates dependency locks to remove current body-parser, fast-uri, hono, ip-address, markdown-it and zod findings. Markdown's dependency floor is 14.3.3. The exact MCP dependency is 0.1.11-rc.3; its local source lock resolves the retained release/vendor archive, without requiring registry publication. The shipped CLI package contains dist/scripts and declares the final exact MCP candidate version.

Full npm audit is clean. All 187 CLI tests pass with zero skips on Node 22.13.0 and 24.0.0, including the actual Go 1.26.10 CMS contracts, browser hydration and Node 20.19 rejection. CI retains both minimum runtimes and adds a strict audit gate. Candidate archives and matching CMS are requalified in primocms/primo#1363.

No merge, tag, package publication or deployment is performed. Publish the approved MCP first only after separate release authorization, then refresh final registry version/integrity and reverify exact CLI/CMS packages. RC.2 evidence remains historical.
