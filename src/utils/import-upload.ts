import { createHash } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { response_error } from './push-guard.js'

const DEFAULT_CHUNK_BYTES = 1024 * 1024
const MIN_CHUNK_BYTES = 64 * 1024
const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex')

// Stage large archives in bounded requests, then use the existing guarded
// import exactly once. This also splits individual assets larger than a proxy's
// limit, without partial content updates or bypassing revision/backup checks.
export async function post_import(endpoint: string, form: FormData, token?: string | null): Promise<Response> {
	const archive = form.get('file')
	if (!(archive instanceof Blob)) throw new Error('Import archive is missing.')
	const file: Blob = archive
	if (file.size > MAX_ARCHIVE_BYTES) throw new Error('Import archive exceeds the CMS limit of 512 MiB. Reduce the archive before pushing.')
	const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
	const url = new URL(endpoint)
	const endpoint_path = url.pathname
	const base_path = endpoint_path.slice(0, endpoint_path.indexOf('/api/primo/'))
	const staging = `${url.origin}${base_path}/api/primo/import-uploads`
	// A reverse proxy may mount the CMS below a path prefix; the server sees
	// only its own route. Never send credentials to a URL from a response.
	const server_endpoint = endpoint_path.slice(base_path.length)
	let bytes: Uint8Array | undefined
	let unsupported = false

	async function stage(): Promise<Response | undefined> {
		bytes ??= new Uint8Array(await file.arrayBuffer())
		const start = await fetch(staging, {
			method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({ endpoint: server_endpoint, size: bytes.byteLength, sha256: digest(bytes) }),
			signal: AbortSignal.timeout(30000), redirect: 'error'
		})
		if (start.status === 404 || start.status === 405) { unsupported = true; await start.body?.cancel(); return undefined }
		if (!start.ok) throw new Error(`Cannot stage import: ${await response_error(start)}`)
		const session = await start.json() as { protocol?: number; upload_id?: string; chunk_bytes?: number }
		if (session.protocol !== 1 || !/^[a-f0-9]{64}$/.test(session.upload_id || '') ||
			!Number.isSafeInteger(session.chunk_bytes) || session.chunk_bytes! < MIN_CHUNK_BYTES) {
			throw new Error('Server returned an invalid batched-upload session.')
		}
		const upload_url = `${staging}/${session.upload_id}`
		let chunk_size = Math.min(DEFAULT_CHUNK_BYTES, session.chunk_bytes!)
		try {
			for (let offset = 0; offset < bytes.byteLength;) {
				const chunk = bytes.slice(offset, offset + chunk_size)
				let response: Response | undefined
				// Only chunk PUTs retry: the server checks replayed bytes. Never
				// retry the final import POST after an ambiguous network failure.
				for (let attempt = 0; attempt < 3; attempt++) {
					try {
						response = await fetch(`${upload_url}?offset=${offset}`, {
							method: 'PUT', headers: { ...headers, 'Content-Type': 'application/octet-stream', 'X-Primo-Chunk-SHA256': digest(chunk) },
							body: chunk, signal: AbortSignal.timeout(30000), redirect: 'error'
						})
						if (![408, 429, 500, 502, 503, 504].includes(response.status) || attempt === 2) break
						await response.body?.cancel()
					} catch (error) {
						if (attempt === 2) throw error
					}
					await delay(250 * 2 ** attempt)
				}
				if (!response) throw new Error('Upload chunk did not receive a response.')
				if (response.status === 413) {
					await response.body?.cancel()
					if (chunk_size <= MIN_CHUNK_BYTES) throw new Error('Proxy rejects even 64 KiB upload chunks. Increase its request-body limit before retrying.')
					chunk_size = Math.max(MIN_CHUNK_BYTES, Math.floor(chunk_size / 2))
					continue
				}
				if (!response.ok) throw new Error(`Upload chunk failed: ${await response_error(response)}`)
				const acknowledgement = await response.json() as { received?: number }
				if (acknowledgement.received !== offset + chunk.byteLength) throw new Error('Server acknowledged an unexpected upload offset; import was not submitted.')
				offset += chunk.byteLength
			}
			const commit = new FormData()
			for (const [key, value] of form.entries()) if (key !== 'file') commit.append(key, value)
			commit.set('upload_id', session.upload_id!)
			return await fetch(endpoint, { method: 'POST', headers, body: commit, redirect: 'error' })
		} finally {
			// Cleanup cannot turn a successful commit into a reported failure.
			// On disconnect/crash the server's TTL removes abandoned staging.
			await fetch(upload_url, { method: 'DELETE', headers, signal: AbortSignal.timeout(5000), redirect: 'error' }).then(r => r.body?.cancel()).catch(() => {})
		}
	}

	if (file.size > DEFAULT_CHUNK_BYTES) {
		const response = await stage()
		if (response) return response
	}
	// Small requests and older servers retain the multipart protocol. A proxy
	// can enforce a smaller limit; a rejected direct request then uses staging.
	const response = await fetch(endpoint, { method: 'POST', headers, body: form, redirect: 'error' })
	if (response.status !== 413) return response
	await response.body?.cancel()
	if (!unsupported) {
		const staged = await stage()
		if (staged) return staged
	}
	throw new Error('Upload rejected (HTTP 413). This CMS does not support batched uploads; upgrade the CMS and CLI together, then retry.')
}
