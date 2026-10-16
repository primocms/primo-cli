#!/usr/bin/env node

// Check before loading dependencies that use newer Node built-ins.
const [major, minor] = process.versions.node.split('.').map(Number)
if (!((major === 22 && minor >= 13) || major >= 24)) {
	console.error(`Primo requires Node.js 22.13+ (22.x) or Node.js 24+. You are running ${process.versions.node}. Upgrade Node.js and try again.`)
	process.exit(1)
}
await import('./index.js')
export {}
