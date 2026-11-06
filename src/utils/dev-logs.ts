import fs from 'node:fs'
import path from 'node:path'
import type { Readable } from 'node:stream'
import { StringDecoder } from 'node:string_decoder'
import { stripVTControlCharacters } from 'node:util'

export const DEV_LOG_FILE = '.primo/dev.log'
export const DEV_LOG_MAX_BYTES = 5 * 1024 * 1024

// One writer per workspace, protected by claim_dev_runtime. Synchronous writes
// retain startup failures and the last messages even when the CLI exits at once.
export function start_dev_logging(workspace: string, max_bytes = DEV_LOG_MAX_BYTES) {
	const file = path.join(workspace, DEV_LOG_FILE)
	const originals = {
		stdout: process.stdout.write,
		stderr: process.stderr.write
	}
	let enabled = true
	let size = 0
	try {
		fs.mkdirSync(path.dirname(file), { recursive: true })
		try {
			if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Log path is a symbolic link')
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
		}
		const descriptor = fs.openSync(file, fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_WRONLY | (fs.constants.O_NOFOLLOW ?? 0), 0o600)
		try {
			if (!fs.fstatSync(descriptor).isFile()) throw new Error('Log path is not a regular file')
			fs.fchmodSync(descriptor, 0o600)
			size = fs.fstatSync(descriptor).size
		} finally {
			fs.closeSync(descriptor)
		}
	} catch (error) {
		enabled = false
		originals.stderr.call(process.stderr, `Primo could not open ${file}; continuing without file logging: ${String(error)}\n`)
	}
	const append = (source: string, message: string) => {
		const clean = stripVTControlCharacters(message).replace(/\r/g, '')
		if (!enabled || !clean.trim()) return
		try {
			const stamp = new Date().toISOString()
			for (const line of clean.split('\n')) {
				if (!line.trim()) continue
				// Bound each line too, without splitting a UTF-16 surrogate pair.
				for (let offset = 0; offset < line.length; ) {
					let end = Math.min(offset + 8192, line.length)
					if (end < line.length && /[\uD800-\uDBFF]/.test(line[end - 1])) end--
					const text = `[${stamp}] [${source}] ${line.slice(offset, end)}\n`
					offset = end
					const bytes = Buffer.byteLength(text)
					if (size && size + bytes > max_bytes) {
						fs.renameSync(file, `${file}.1`)
						size = 0
					}
					const descriptor = fs.openSync(file, fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_WRONLY | (fs.constants.O_NOFOLLOW ?? 0), 0o600)
					try {
						const opened = fs.fstatSync(descriptor), current = fs.lstatSync(file)
						// Verify before writing, also on platforms without O_NOFOLLOW.
						if (!opened.isFile() || !current.isFile() || current.isSymbolicLink() || opened.dev !== current.dev || opened.ino !== current.ino) throw new Error('Log path changed or is not a regular file')
						fs.writeSync(descriptor, text)
					} finally { fs.closeSync(descriptor) }
					size += bytes
				}
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
	const flushers: (() => void)[] = []
	let stopped = false
	return {
		file,
		// Forward CMS output through the original writers, avoiding duplicate CLI
		// entries. StringDecoder preserves UTF-8 split across pipe chunks.
		capture(stream: 'stdout' | 'stderr', source?: Readable) {
			const decoder = new StringDecoder('utf8')
			let pending = ''
			let escape = 'text'
			// Strip controls incrementally, retaining only parser state for a
			// split escape rather than an unbounded OSC/CSI payload.
			const cleanChunk = (text: string) => {
				let clean = ''
				for (const character of text) {
					const code = character.charCodeAt(0)
					if (escape === 'text') {
						if (character === '\x1b') escape = 'escape'
						else if (character === '\x9b') escape = 'csi'
						else if (character === '\x9d') escape = 'string'
						else clean += character
					} else if (escape === 'escape') {
						if (character === '[') escape = 'csi'
						else if (']PX^_'.includes(character)) escape = 'string'
						else if (code >= 0x20 && code <= 0x2f) escape = 'intermediate'
						else escape = character === '\x1b' ? 'escape' : 'text'
					} else if (escape === 'csi') {
						if (code >= 0x40 && code <= 0x7e) escape = 'text'
						else if (character === '\x1b') escape = 'escape'
					} else if (escape === 'string') {
						if (character === '\x07' || character === '\x9c') escape = 'text'
						else if (character === '\x1b') escape = 'stringEscape'
					} else if (escape === 'stringEscape') {
						escape = character === '\\' ? 'text' : character === '\x1b' ? 'stringEscape' : 'string'
					} else if (code >= 0x30 && code <= 0x7e) escape = 'text'
				}
				return clean
			}
			flushers.push(() => {
				append(`cms:${stream}`, pending + cleanChunk(decoder.end()))
				pending = ''
			})
			return (chunk: Buffer) => {
				pending += cleanChunk(decoder.write(chunk))
				const lastNewline = pending.lastIndexOf('\n')
				if (lastNewline >= 0) {
					append(`cms:${stream}`, pending.slice(0, lastNewline + 1))
					pending = pending.slice(lastNewline + 1)
				}
				// Control sequences are already stripped; bound unterminated text.
				while (pending.length > 16384) {
					const boundary = /[\uD800-\uDBFF]/.test(pending[8191]) ? 8191 : 8192
					append(`cms:${stream}`, pending.slice(0, boundary))
					pending = pending.slice(boundary)
				}
				if (!originals[stream].call(process[stream], chunk) && source) {
					source.pause()
					process[stream].once('drain', () => source.resume())
				}
			}
		},
		stop() {
			if (stopped) return
			stopped = true
			for (const flush of flushers) flush()
			process.stdout.write = originals.stdout
			process.stderr.write = originals.stderr
		}
	}
}

/** Keep startup diagnostics bounded without splitting UTF-8 or surrogate pairs. */
export function create_utf8_tail(limit = 65536) {
 const decoder = new StringDecoder('utf8')
 let text = ''
 const append = (chunk: string) => {
  text = (text + chunk).slice(-limit)
  if (text.length && /[\uDC00-\uDFFF]/.test(text[0])) text = text.slice(1)
 }
 return { write(chunk: Buffer) { append(decoder.write(chunk)) }, end() { append(decoder.end()); return text } }
}
