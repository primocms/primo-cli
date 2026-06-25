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
const VERSION = '3.2.2' // matches primo releases

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
	const base = 'https://github.com/primocms/primo/releases/download'
	const filename = `primo_${platform.os}_${platform.arch}${platform.ext}`
	return `${base}/v${VERSION}/${filename}`
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

	// A managed binary already on disk is reused only when it matches the pinned
	// version. A stale binary (older release, or a pre-rename "palacms" build
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

	const spinner = ora(
		updating_from
			? `Updating primo ${updating_from} → ${VERSION}...`
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

		spinner.succeed(updating_from ? `Primo updated to ${VERSION}` : 'Primo setup complete')
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
	return installed === VERSION
}
