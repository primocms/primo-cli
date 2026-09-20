import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { group_id_notice } from '../dist/utils/server-config.js'

const GROUPS = [{ id: 'architecture1', name: 'Architecture & Interior Design', index: 0 }]

describe('group_id_notice', () => {
	test('explains a short, human-chosen group id', () => {
		const notice = group_id_notice('architecture1', GROUPS)
		assert.ok(notice)
		assert.match(notice, /local reference/)
		assert.match(notice, /Architecture & Interior Design/)
		assert.match(notice, /architecture1/)
	})

	test('resolves a group referenced by name', () => {
		const notice = group_id_notice('Architecture & Interior Design', GROUPS)
		assert.ok(notice)
		assert.match(notice, /local reference/)
	})

	test('stays quiet for server-shaped ids', () => {
		assert.equal(group_id_notice('cmsgroupsrv00001', GROUPS), null)
	})

	test('stays quiet when no group is configured', () => {
		assert.equal(group_id_notice(undefined, GROUPS), null)
		assert.equal(group_id_notice('   ', GROUPS), null)
	})
})
