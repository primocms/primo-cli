import http from 'http'
import archiver from 'archiver'

/**
 * A stand-in for a Primo server, just complete enough for the CLI to talk to.
 *
 * The point is to assert the request the CLI actually makes — path, method,
 * auth header — rather than to reimplement the server. Published 0.1.10 and
 * 0.1.11 both shipped a dist that called the old /api/palacms/* routes and
 * 404'd against every real server; nothing in this repo would have noticed.
 * Recording requests here is what makes that class of break visible.
 */
export async function start_mock_server({ sites = [], export_files = {} } = {}) {
	const requests = []

	const server = http.createServer(async (req, res) => {
		const url = new URL(req.url, 'http://127.0.0.1')
		const body = await read_body(req)
		requests.push({
			method: req.method,
			path: url.pathname,
			query: Object.fromEntries(url.searchParams),
			authorization: req.headers.authorization ?? null,
			content_type: req.headers['content-type'] ?? null,
			body_length: body.length
		})

		if (url.pathname === '/api/health') {
			return json(res, 200, { status: 'ok' })
		}

		if (url.pathname === '/api/collections/sites/records') {
			return json(res, 200, { items: sites, page: 1, perPage: 200, totalItems: sites.length })
		}

		if (url.pathname === '/api/collections/site_groups/records') {
			return json(res, 200, { items: [], page: 1, perPage: 200, totalItems: 0 })
		}

		const export_match = url.pathname.match(/^\/api\/primo\/export\/([^/]+)$/)
		if (export_match && req.method === 'GET') {
			const site_id = export_match[1]
			if (!sites.some((site) => site.id === site_id)) {
				return json(res, 404, { message: 'no such site' })
			}
			const zip = await make_zip(export_files)
			res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': zip.length })
			return res.end(zip)
		}

		if (url.pathname === '/api/primo/export-library' && req.method === 'GET') {
			const zip = await make_zip({ 'blocks/.keep': '' })
			res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': zip.length })
			return res.end(zip)
		}

		if (/^\/api\/primo\/import\/[^/]+$/.test(url.pathname) && req.method === 'POST') {
			// `diff` is required, not optional: push pipes it straight into
			// print_diff, which Object.entries() it. Omitting it fails with a
			// bare "Cannot convert undefined or null to object".
			return json(res, 200, {
				success: true,
				diff: { pages: { added: [], modified: ['index'], deleted: [] } },
				created_ids: {}
			})
		}

		return json(res, 404, { message: `unhandled ${req.method} ${url.pathname}` })
	})

	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	const { port } = server.address()

	return {
		url: `http://127.0.0.1:${port}`,
		requests,
		/** Every recorded request whose path matches, for order-independent assertions. */
		matching: (pattern) => requests.filter((r) => (typeof pattern === 'string' ? r.path === pattern : pattern.test(r.path))),
		close: () => new Promise((resolve) => server.close(resolve))
	}
}

function json(res, status, payload) {
	const body = JSON.stringify(payload)
	res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) })
	res.end(body)
}

function read_body(req) {
	return new Promise((resolve) => {
		const chunks = []
		req.on('data', (chunk) => chunks.push(chunk))
		req.on('end', () => resolve(Buffer.concat(chunks)))
	})
}

/** Builds the zip the export endpoints return, from a {path: contents} map. */
function make_zip(files) {
	return new Promise((resolve, reject) => {
		const archive = archiver('zip', { zlib: { level: 0 } })
		const chunks = []
		archive.on('data', (chunk) => chunks.push(chunk))
		archive.on('error', reject)
		archive.on('end', () => resolve(Buffer.concat(chunks)))
		for (const [name, contents] of Object.entries(files)) {
			archive.append(contents, { name })
		}
		archive.finalize()
	})
}
