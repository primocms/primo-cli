import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { post_import } from '../dist/utils/import-upload.js'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const sessionID = 'a'.repeat(64)
const endpoint = 'https://cms.test/api/primo/import/testsite0000001'
function form(bytes) {
	const data = new FormData()
	data.set('file', new Blob([bytes]), 'site.zip')
	data.set('expected_revision', 'v1:' + 'b'.repeat(64))
	data.set('force', 'true')
	return data
}

test('proxy 413 shrinks chunks; lost acknowledgements replay exactly; final form retains guards', async t => {
	const bytes = randomBytes(2 * 1024 * 1024 + 7)
	let received = Buffer.alloc(0), starts = 0, commits = 0, cancelled = 0, lost = false, rejected = 0
	const sent = []
	t.mock.method(globalThis, 'fetch', async (input, options) => {
		const url = new URL(input)
		assert.equal(options.headers.Authorization, 'Bearer secret')
		if (options.method === 'DELETE') { cancelled++; return new Response(null, { status: 204 }) }
		if (url.pathname.endsWith('/import-uploads')) {
			starts++
			assert.deepEqual(JSON.parse(options.body), { endpoint: new URL(endpoint).pathname, size: bytes.length, sha256: hash(bytes) })
			return json({ protocol: 1, upload_id: sessionID, chunk_bytes: 4 * 1024 * 1024 }, 201)
		}
		if (options.method === 'PUT') {
			const chunk = Buffer.from(options.body), offset = Number(url.searchParams.get('offset'))
			assert.equal(options.headers['X-Primo-Chunk-SHA256'], hash(chunk))
			if (chunk.length > 256 * 1024) { rejected++; return json({}, 413) }
			sent.push([offset, hash(chunk)])
			if (offset === received.length) received = Buffer.concat([received, chunk])
			else assert.deepEqual(received.subarray(offset, offset + chunk.length), chunk)
			if (!lost) { lost = true; throw new TypeError('Connection lost after accepted chunk') }
			return json({ received: received.length })
		}
		commits++
		assert.deepEqual(received, bytes)
		assert.equal(options.body.has('file'), false)
		assert.equal(options.body.get('upload_id'), sessionID)
		assert.equal(options.body.get('expected_revision'), 'v1:' + 'b'.repeat(64))
		assert.equal(options.body.get('force'), 'true')
		return json({ success: true })
	})
	assert.equal((await post_import(endpoint, form(bytes), 'secret')).status, 200)
	assert.equal(starts, 1); assert.equal(commits, 1); assert.equal(cancelled, 1); assert.equal(rejected, 2)
	assert.deepEqual(sent[0], sent[1])
})

test('smaller direct upload rejected by proxy switches to chunks', async t => {
	const bytes = randomBytes(400 * 1024)
	let direct = 0, staged = 0
	t.mock.method(globalThis, 'fetch', async (url, options) => {
		if (options.method === 'DELETE') return new Response(null, { status: 204 })
		if (String(url).endsWith('/import-uploads')) { staged++; return json({ protocol: 1, upload_id: sessionID, chunk_bytes: 128 * 1024 }, 201) }
		if (options.method === 'PUT') return json({ received: Number(new URL(url).searchParams.get('offset')) + options.body.length })
		if (options.body.has('file')) { direct++; return json({}, 413) }
		return json({ success: true })
	})
	assert.equal((await post_import(endpoint, form(bytes))).status, 200)
	assert.equal(direct, 1); assert.equal(staged, 1)
})

test('older server keeps multipart compatibility and explains a proxy rejection', async t => {
	let reject = false, direct = 0
	t.mock.method(globalThis, 'fetch', async (url, options) => {
		if (String(url).endsWith('/import-uploads')) return json({}, 404)
		direct++
		assert.ok(options.body.get('file') instanceof Blob)
		return json({}, reject ? 413 : 200)
	})
	const data = form(randomBytes(1024 * 1024 + 1))
	assert.equal((await post_import(endpoint, data)).status, 200)
	reject = true
	await assert.rejects(post_import(endpoint, data), /upgrade the CMS and CLI together/)
	assert.equal(direct, 2)
})

test('failed chunks cancel staging without submitting import', async t => {
	let commits = 0, cancellations = 0, attempts = 0
	t.mock.method(globalThis, 'fetch', async (url, options) => {
		if (options.method === 'DELETE') { cancellations++; return new Response(null, { status: 204 }) }
		if (String(url).endsWith('/import-uploads')) return json({ protocol: 1, upload_id: sessionID, chunk_bytes: 1024 * 1024 }, 201)
		if (options.method === 'PUT') { attempts++; return json({ message: 'temporary failure' }, 503) }
		commits++; return json({})
	})
	await assert.rejects(post_import(endpoint, form(randomBytes(1024 * 1024 + 1))), /Upload chunk failed/)
	assert.equal(attempts, 3); assert.equal(commits, 0); assert.equal(cancellations, 1)
})

test('ambiguous final import is never automatically retried', async t => {
	let commits = 0, cancellations = 0
	t.mock.method(globalThis, 'fetch', async (url, options) => {
		if (options.method === 'DELETE') { cancellations++; return new Response(null, { status: 204 }) }
		if (String(url).endsWith('/import-uploads')) return json({ protocol: 1, upload_id: sessionID, chunk_bytes: 1024 * 1024 }, 201)
		if (options.method === 'PUT') return json({ received: Number(new URL(url).searchParams.get('offset')) + options.body.length })
		commits++; throw new TypeError('Connection lost during commit')
	})
	await assert.rejects(post_import(endpoint, form(randomBytes(1024 * 1024 + 1))), /Connection lost during commit/)
	assert.equal(commits, 1); assert.equal(cancellations, 1)
})

test('minimum chunk bound reports an actionable proxy error', async t => {
	let commits = 0, attempts = 0
	t.mock.method(globalThis, 'fetch', async (url, options) => {
		if (options.method === 'DELETE') return new Response(null, { status: 204 })
		if (String(url).endsWith('/import-uploads')) return json({ protocol: 1, upload_id: sessionID, chunk_bytes: 1024 * 1024 }, 201)
		if (options.method === 'PUT') { attempts++; return json({}, 413) }
		commits++; return json({})
	})
	await assert.rejects(post_import(endpoint, form(randomBytes(1024 * 1024 + 1))), /Increase its request-body limit/)
	assert.equal(attempts, 5); assert.equal(commits, 0)
})
