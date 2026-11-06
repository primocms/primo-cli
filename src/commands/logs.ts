import fs from 'node:fs/promises'
import { StringDecoder } from 'node:string_decoder'
import { read_dev_logs } from '../utils/read-dev-logs.js'

export async function logs(options: { dir: string; lines: string; follow?: boolean; previous?: boolean; json?: boolean }) {
	try {
		if (options.previous && options.follow) throw new Error('--previous cannot be combined with --follow')
		if (options.json && options.follow) throw new Error('--json cannot be combined with --follow')
		const result = await read_dev_logs(options.dir, Number(options.lines), options.previous)
		if (options.json) { console.log(JSON.stringify(result, null, 2)); return }
		if (result.text) process.stdout.write(result.text)
		if (!result.available) console.error(`No dev logs at ${result.log_file}. Start primo dev in ${result.workspace} to record logs.`)
		if (!options.follow) return
		let stopped = false
		const stop = () => { stopped = true }
		process.on('SIGINT', stop)
		process.on('SIGTERM', stop)
		let decoder = new StringDecoder('utf8')
		let handle: Awaited<ReturnType<typeof fs.open>> | undefined
		try {
			while (!stopped) {
				try {
					if (!handle) {
						handle = await fs.open(result.log_file, 'r')
						const current = await handle.stat()
						if (result.log_id && `${current.dev}:${current.ino}` !== result.log_id) {
							// Rotation may happen between the initial tail and opening
							// the follower. Drain the retained file before switching.
							let previous: Awaited<ReturnType<typeof fs.open>> | undefined
							try {
								previous = await fs.open(result.log_file + '.1', 'r')
								const old = await previous.stat()
								if (`${old.dev}:${old.ino}` === result.log_id) {
									await handle.close(); handle = previous; previous = undefined
								}
							} catch (error) {
								if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
							} finally { await previous?.close() }
						}
					}
					const stat = await handle.stat()
					const id = `${stat.dev}:${stat.ino}`
					if (id !== result.log_id || stat.size < result.offset) {
						result.offset = 0
						result.log_id = id
						decoder = new StringDecoder('utf8')
					}
					// Drain in bounded chunks; a large backlog never needs one allocation.
					const buffer = Buffer.alloc(Math.min(65536, Math.max(0, stat.size - result.offset)))
					const { bytesRead } = await handle.read(buffer, 0, buffer.length, result.offset)
					if (bytesRead) process.stdout.write(decoder.write(buffer.subarray(0, bytesRead)))
					result.offset += bytesRead
					if (bytesRead) continue
					const current = await fs.stat(result.log_file)
					if (`${current.dev}:${current.ino}` !== id) {
						await handle.close(); handle = undefined
						result.log_id = ''; result.offset = 0
						decoder = new StringDecoder('utf8')
						continue
					}
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
				}
				await new Promise(resolve => setTimeout(resolve, 250))
			}
		} finally {
			await handle?.close()
			process.removeListener('SIGINT', stop)
			process.removeListener('SIGTERM', stop)
		}
	} catch (error) {
		console.error(error instanceof Error ? error.message : String(error))
		process.exitCode = 1
	}
}
