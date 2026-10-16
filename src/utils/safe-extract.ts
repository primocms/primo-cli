import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import yauzl, { type Entry } from 'yauzl'

// Exports contain data files, never links or device files. Validate the entire
// directory before creating any archive entry, including on Windows/macOS.
export default async function extract(archive: string, { dir }: { dir: string }): Promise<void> {
	const zip = await yauzl.openPromise(archive, { lazyEntries: true, autoClose: false, strictFileNames: true })
	try {
		const entries: { entry: Entry; parts: string[]; directory: boolean }[] = []
		const names = new Map<string, boolean>()
		for await (const entry of zip.eachEntry()) {
			const name = entry.fileName
			const directory = name.endsWith('/')
			const parts = (directory ? name.slice(0, -1) : name).split('/')
			if (parts.some(part => !part || part === '.' || part === '..' || /[<>"\\:|?*\x00-\x1f\x7f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|conin\$|conout\$|com[0-9¹²³]|lpt[0-9¹²³])(?:\.|$)/i.test(part))) {
				throw new Error(`Unsafe ZIP path: ${name}`)
			}
			const kind = (entry.externalFileAttributes >>> 16) & 0xf000
			if (kind !== 0 && kind !== (directory ? 0x4000 : 0x8000)) throw new Error(`Unsafe ZIP entry type: ${name}`)
			if (entry.isEncrypted()) throw new Error(`Encrypted ZIP entry: ${name}`)
			const key = parts.map(part => part.normalize('NFC').toLowerCase()).join('/')
			if (names.has(key)) throw new Error(`Duplicate ZIP path: ${name}`)
			names.set(key, directory)
			entries.push({ entry, parts, directory })
		}
		for (const { parts } of entries) {
			for (let i = 1; i < parts.length; i++) {
				const key = parts.slice(0, i).map(part => part.normalize('NFC').toLowerCase()).join('/')
				if (names.get(key) === false) throw new Error(`ZIP file used as directory: ${parts.join('/')}`)
			}
		}
		const root = path.resolve(dir)
		await fs.mkdir(root, { recursive: true })
		await require_directory(root)
		for (const { entry, parts, directory } of entries) {
			let parent = root
			for (const part of directory ? parts : parts.slice(0, -1)) {
				parent = path.join(parent, part)
				await fs.mkdir(parent, { mode: 0o700 }).catch(error => { if (error.code !== 'EEXIST') throw error })
				await require_directory(parent)
			}
			if (!directory) {
				// Exclusive creation refuses existing files and final-component links.
				await pipeline(await zip.openReadStreamPromise(entry), createWriteStream(path.join(parent, parts.at(-1)!), { flags: 'wx', mode: 0o600 }))
			}
		}
	} finally {
		zip.close()
	}
}

async function require_directory(dir: string): Promise<void> {
	const stat = await fs.lstat(dir)
	if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe extraction directory: ${dir}`)
}
