import fs from 'node:fs'
import path from 'node:path'
import { StringDecoder } from 'node:string_decoder'
import { stripVTControlCharacters } from 'node:util'

export const DEV_LOG_FILE = '.primo/dev.log'
export const DEV_LOG_MAX_BYTES = 5 * 1024 * 1024

// One writer per workspace, protected by claim_dev_runtime. Synchronous writes
// retain startup failures and the last messages even when the CLI exits at once.
export function start_dev_logging(workspace: string, max_bytes = DEV_LOG_MAX_BYTES) {
	const file = path.join(workspace, DEV_LOG_FILE)
	fs.mkdirSync(path.dirname(file), { recursive: true })
	fs.closeSync(fs.openSync(file, 'a', 0o600))
	fs.chmodSync(file, 0o600)
	let size = fs.statSync(file).size
	const originals = { stdout: process.stdout.write, stderr: process.stderr.write }
	let enabled = true
	const append = (source: string, message: string) => {
		const clean = stripVTControlCharacters(message).replace(/\r/g, '')
		if (!enabled || !clean.trim()) return
		try {
			// Bound each write too, so an unusually long line cannot bypass rotation.
			for (let offset = 0; offset < clean.length;) {
				let end = Math.min(offset + 8192, clean.length)
				// Do not split a surrogate pair when chunking long Unicode output.
				if (end < clean.length && /[\uD800-\uDBFF]/.test(clean[end - 1])) end--
				const text = `[${new Date().toISOString()}] [${source}] ${clean.slice(offset, end).replace(/\n$/, '')}\n`
				offset = end
				const bytes = Buffer.byteLength(text)
				if (size && size + bytes > max_bytes) {
					fs.renameSync(file, `${file}.1`)
					size = 0
				}
				fs.appendFileSync(file, text, { mode: 0o600 })
				size += bytes
			}
		} catch (error) {
			enabled = false
			originals.stderr.call(process.stderr, `Primo could not write ${file}: ${String(error)}\n`)
		}
	}
	for (const stream of ['stdout', 'stderr'] as const) {
		const target = process[stream]
		const decoder = new StringDecoder('utf8')
		target.write = function (chunk: string | Uint8Array, ...args: any[]) {
			append(`cli:${stream}`, typeof chunk === 'string' ? chunk : decoder.write(Buffer.from(chunk)))
			return (originals[stream] as Function).call(target, chunk, ...args)
		} as typeof target.write
	}
	append('cli', `Session started (pid ${process.pid})`)
	return {
		file,
		// Forward CMS output through the original writers, avoiding duplicate CLI
		// entries. StringDecoder preserves UTF-8 split across pipe chunks.
		capture(stream: 'stdout' | 'stderr') {
			const decoder = new StringDecoder('utf8')
			return (chunk: Buffer) => {
				append(`cms:${stream}`, decoder.write(chunk))
				originals[stream].call(process[stream], chunk)
			}
		},
		stop() {
			process.stdout.write = originals.stdout
			process.stderr.write = originals.stderr
		}
	}
}
