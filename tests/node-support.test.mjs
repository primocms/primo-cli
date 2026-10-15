import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
test('the packaged CLI starts on its supported runtime', () => {
  assert.equal(pkg.engines.node, '^22.13.0 || >=24.0.0')
  const result = spawnSync(process.execPath, [path.join(root, pkg.bin.primo), '--version'], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), pkg.version)
})
// CI covers supported versions; local old installations verify the startup
// guard runs before Inquirer imports unavailable Node built-ins.
for (const node of (process.env.PRIMO_TEST_OLD_NODE || '').split(path.delimiter).filter(Boolean)) {
  test(`unsupported runtime explains the upgrade: ${node}`, { skip: !existsSync(node) }, () => {
    const version = spawnSync(node, ['-p', 'process.versions.node'], { encoding: 'utf8' }).stdout.trim()
    if (Number(version.split('.')[0]) >= 22) return
    const result = spawnSync(node, [path.join(root, pkg.bin.primo), '--version'], { encoding: 'utf8' })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Primo requires Node.js 22.13/)
    assert.ok(result.stderr.includes(version))
    assert.doesNotMatch(result.stderr, /SyntaxError|styleText/)
  })
}
