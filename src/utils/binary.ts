import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { fileURLToPath } from 'url'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import chalk from 'chalk'
import ora from 'ora'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PRIMO_HOME = path.join(os.homedir(), '.primo')
const BIN_DIR = path.join(PRIMO_HOME, 'bin')
const REPO = 'primocms/primo'

// Outcome of a latest-release lookup. We distinguish three cases so callers can
// react correctly rather than collapsing everything to "unknown":
//   - resolved: got a semver
//   - unavailable: reached a verdict that there's nothing usable (unreleased
//     repo, unparseable tag) — a real "no version" answer
//   - throttled: GitHub rate-limited us (403/429) or the request timed out /
//     failed to connect. This is NOT the same as "up to date" — we just can't
//     confirm right now, so callers must avoid claiming currency off the back
//     of it.
type VersionLookup =
	| { status: 'resolved'; version: string }
	| { status: 'unavailable' }
	| { status: 'throttled'; reason: string }

// Resolve the latest primo release tag at runtime rather than pinning a version
// here — a pinned constant silently goes stale (it sat on 3.2.3 through two
// releases). Cached for the process so repeated calls in one CLI run don't
// re-hit the API. Bounded by a 10s timeout so an already-installed binary can
// still be reused promptly when GitHub is slow or unreachable.
let latest_version_cache: VersionLookup | undefined
async function get_latest_version(): Promise<VersionLookup> {
	if (latest_version_cache !== undefined) return latest_version_cache
	try {
		const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
			headers: { Accept: 'application/vnd.github+json' },
			// Node 18+ ships AbortSignal.timeout; keeps the version check from
			// hanging CLI startup when GitHub stalls.
			signal: AbortSignal.timeout(10_000)
		})
		// Rate limits come back as 403 or 429. Detect them the way GitHub's docs
		// prescribe, since no single signal covers every case:
		//   - primary limit: 403 with x-ratelimit-remaining: 0
		//   - secondary limit: 403/429 with a Retry-After header, or a body
		//     message mentioning a secondary rate limit (remaining may be > 0)
		//   - 429 is always a rate limit
		// Treat all of these as "can't tell", never a definitive version —
		// otherwise a throttled run would mask an outdated binary as current. A
		// plain 403 with quota remaining (e.g. a genuine permission error) is a
		// real "unavailable" verdict, not a throttle.
		if (res.status === 403 || res.status === 429) {
			const remaining = res.headers.get('x-ratelimit-remaining')
			const retry_after = res.headers.get('retry-after')
			let rate_limited = res.status === 429 || remaining === '0' || retry_after !== null
			if (!rate_limited) {
				// Last resort: peek at the body for the secondary-limit message.
				const body = await res.text().catch(() => '')
				rate_limited = /secondary rate limit|rate limit/i.test(body)
			}
			latest_version_cache = rate_limited
				? { status: 'throttled', reason: `GitHub rate limit (${res.status})` }
				: { status: 'unavailable' }
			return latest_version_cache
		}
		if (!res.ok) throw new Error(`GitHub API ${res.status}`)
		const data = (await res.json()) as { tag_name?: string }
		const version = parse_semver(data.tag_name ?? null)
		latest_version_cache = version ? { status: 'resolved', version } : { status: 'unavailable' }
	} catch (err) {
		// Timeout / DNS / connection reset — indistinguishable from being
		// offline. Treat as throttled (can't confirm) so we don't force a
		// needless re-download of a working binary.
		latest_version_cache = {
			status: 'throttled',
			reason: err instanceof Error ? err.message : 'network error'
		}
	}
	return latest_version_cache
}

// Path to locally built binary (for development)
// The binary is at primo/primo (inside the primo repo directory)
const LOCAL_BINARY = path.resolve(__dirname, '..', '..', '..', 'primo', 'primo')

interface PlatformInfo {
	os: string
	arch: string
	ext: string
}

function get_platform(): PlatformInfo {
	const platform = os.platform()
	const arch = os.arch()

	let osName: string
	let archName: string
	let ext = ''

	switch (platform) {
		case 'darwin':
			osName = 'darwin'
			break
		case 'linux':
			osName = 'linux'
			break
		case 'win32':
			osName = 'windows'
			ext = '.exe'
			break
		default:
			throw new Error(`Unsupported platform: ${platform}`)
	}

	switch (arch) {
		case 'arm64':
			archName = 'arm64'
			break
		case 'x64':
			archName = 'amd64'
			break
		default:
			throw new Error(`Unsupported architecture: ${arch}`)
	}

	return { os: osName, arch: archName, ext }
}

function get_download_url(platform: PlatformInfo): string {
	// /releases/latest/download/<asset> 302-redirects to the newest release's
	// asset, so we never name a version here — the binary always tracks the
	// latest published release. fetch() follows the redirect automatically.
	const base = `https://github.com/${REPO}/releases/latest/download`
	const filename = `primo_${platform.os}_${platform.arch}${platform.ext}`
	return `${base}/${filename}`
}

// Extract a bare semver (e.g. "3.2.1") from a binary's --version output.
// The server prints a build banner first, then "<name> version vX.Y.Z", so we
// scan for the semver rather than trusting the whole string. Returns null when
// no semver is present (e.g. a "dev" build), which callers treat as a mismatch.
function parse_semver(output: string | null): string | null {
	if (!output) return null
	const match = output.match(/\bv?(\d+\.\d+\.\d+)\b/)
	return match ? match[1] : null
}

export async function get_binary_path(): Promise<string> {
	// Explicit override wins — layout-independent, the way to point at a
	// local server build regardless of where this CLI lives on disk.
	const override = process.env.PRIMO_BINARY
	if (override) {
		try {
			await fs.access(override, fs.constants.X_OK)
			return override
		} catch {
			throw new Error(`PRIMO_BINARY is set to "${override}" but it is not an executable file`)
		}
	}

	// Otherwise prefer a sibling dev build (only resolves when running from
	// source next to a `primo` checkout), then fall back to the download.
	try {
		await fs.access(LOCAL_BINARY, fs.constants.X_OK)
		return LOCAL_BINARY
	} catch {}

	// Fall back to downloaded binary
	const platform = get_platform()
	return path.join(BIN_DIR, `primo${platform.ext}`)
}

export async function ensure_data_dir(base_dir: string): Promise<string> {
	const data_dir = path.join(base_dir, '.primo')
	await fs.mkdir(data_dir, { recursive: true })
	return data_dir
}

export async function is_binary_installed(): Promise<boolean> {
	try {
		const binary_path = await get_binary_path()
		await fs.access(binary_path, fs.constants.X_OK)
		return true
	} catch {
		return false
	}
}

export async function ensure_binary(): Promise<string> {
	// If PRIMO_BINARY is set, honor it exclusively — surface a bad override
	// rather than silently downloading a release binary behind the user's back.
	if (process.env.PRIMO_BINARY) {
		return await get_binary_path()
	}

	// A sibling dev build (running from source next to a `primo` checkout) is
	// developer-chosen — never replace it with a download, even if its version
	// differs from the pinned release.
	try {
		await fs.access(LOCAL_BINARY, fs.constants.X_OK)
		return LOCAL_BINARY
	} catch {}

	// A managed binary already on disk is reused only when it matches the latest
	// release. A stale binary (older release, or a pre-rename "palacms" build
	// reporting a different version) is re-downloaded so fixes actually reach
	// users who already have a binary installed.
	let updating_from: string | null = null
	if (await is_binary_installed()) {
		if (await is_binary_current()) {
			return await get_binary_path()
		}
		updating_from = await get_binary_version()
	}

	// Need to download - get the target path
	const platform = get_platform()
	const binary_path = path.join(BIN_DIR, `primo${platform.ext}`)

	// Resolve the target version for display only (the download URL follows the
	// /latest redirect regardless). Falls back to "latest" when we couldn't
	// confirm the tag; surface a throttle notice so a rate-limited check isn't
	// silent.
	const lookup = await get_latest_version()
	const target_version = lookup.status === 'resolved' ? lookup.version : 'latest'
	if (lookup.status === 'throttled') {
		console.log(chalk.dim(`  (couldn't confirm latest version: ${lookup.reason}; downloading current release)`))
	}

	const spinner = ora(
		updating_from
			? `Updating primo ${updating_from} → ${target_version}...`
			: 'Setting up Primo...'
	).start()

	try {
		// Create directories
		await fs.mkdir(BIN_DIR, { recursive: true })

		const url = get_download_url(platform)

		spinner.text = `Downloading primo for ${platform.os}/${platform.arch}...`

		// Download binary. Stream to a temp path and rename into place so an
		// interrupted download can't leave a half-written binary that later
		// looks "installed". rename() is atomic within the same directory.
		const response = await fetch(url)

		if (!response.ok) {
			throw new Error(`Download failed: ${response.status} ${response.statusText}`)
		}

		const tmp_path = `${binary_path}.download`
		const file_stream = createWriteStream(tmp_path)
		await pipeline(response.body as any, file_stream)

		// Make executable, then atomically replace any existing binary.
		await fs.chmod(tmp_path, 0o755)
		await fs.rename(tmp_path, binary_path)

		spinner.succeed(updating_from ? `Primo updated to ${target_version}` : 'Primo setup complete')
		return binary_path

	} catch (error) {
		spinner.fail('Setup failed')

		// Provide manual instructions
		console.log('')
		console.log(chalk.yellow('To install manually:'))
		console.log(chalk.dim('  1. Download primo from https://github.com/primocms/primo/releases'))
		console.log(chalk.dim(`  2. Place it in ${BIN_DIR}`))
		console.log(chalk.dim('  3. Make it executable: chmod +x primo'))
		console.log('')

		throw error
	}
}

// Return the installed binary's semver (e.g. "3.2.1"), or null if it can't be
// determined (missing binary, dev build, or unparseable output).
export async function get_binary_version(): Promise<string | null> {
	try {
		const binary_path = await get_binary_path()
		const { execFileSync } = await import('child_process')
		// execFile (not execSync) avoids shell quoting issues with the path, and
		// the timeout prevents a wedged binary from hanging CLI startup.
		const output = execFileSync(binary_path, ['--version'], { encoding: 'utf-8', timeout: 5000 })
		return parse_semver(output)
	} catch {
		return null
	}
}

// Whether the installed binary matches the version this CLI pins. A dev/unknown
// version (null) counts as not-current so we refresh to a known-good release.
// Skipped when PRIMO_BINARY or a sibling dev build is in use — those are
// developer-chosen and must not be clobbered by a download.
async function is_binary_current(): Promise<boolean> {
	const installed = await get_binary_version()
	if (!installed) return false
	const latest = await get_latest_version()
	// resolved  → compare versions.
	// throttled → can't confirm (rate-limited / offline); keep the installed
	//             binary rather than thrashing a re-download, and it'll refresh
	//             on the next unthrottled run.
	// unavailable → no usable release to compare against; keep what's on disk.
	if (latest.status !== 'resolved') return true
	return installed === latest.version
}
