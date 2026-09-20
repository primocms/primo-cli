import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { start_mock_server } from './helpers/mock-server.mjs'
import { site_exists } from '../dist/commands/dev.js'

/**
 * `site_exists` must authenticate: the collections API returns 404 for a
 * specific record when the request is unauthenticated, even if the record
 * exists. Reading that as "missing" sends `primo add` down the destructive
 * bootstrap path for an already-registered site.
 */
describe('site_exists', () => {
	test('distinguishes an existing site from a missing one once authenticated', async () => {
		const server = await start_mock_server({ sites: [{ id: 'aaaaaaaaaaaaaaa', name: 'Alpha' }] })
		try {
			assert.equal(await site_exists(server.url, 'aaaaaaaaaaaaaaa'), true)
			assert.equal(await site_exists(server.url, 'zzzzzzzzzzzzzzz'), false)
		} finally {
			await server.close()
		}
	})
})
