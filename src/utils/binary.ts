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
const DATA_DIR = path.join(PRIMO_HOME, 'data')
const VERSION = '0.1.0' // TODO: fetch latest from GitHub

// Path to locally built binary (for development)
// The binary is at palacms/palacms (inside the palacms repo directory)
const LOCAL_BINARY = path.resolve(__dirname, '..', '..', '..', 'palacms', 'palacms')

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
	// TODO: Update to actual GitHub releases URL
	const base = 'https://github.com/palacms/palacms/releases/download'
	const filename = `palacms_${platform.os}_${platform.arch}${platform.ext}`
	return `${base}/v${VERSION}/${filename}`
}

export async function get_binary_path(): Promise<string> {
	// Check for locally built binary first (development)
	try {
		await fs.access(LOCAL_BINARY, fs.constants.X_OK)
		return LOCAL_BINARY
	} catch {}

	// Fall back to downloaded binary
	const platform = get_platform()
	return path.join(BIN_DIR, `palacms${platform.ext}`)
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
	if (await is_binary_installed()) {
		return await get_binary_path()
	}

	// Need to download - get the target path
	const platform = get_platform()
	const binary_path = path.join(BIN_DIR, `palacms${platform.ext}`)

	const spinner = ora('Setting up Pala...').start()

	try {
		// Create directories
		await fs.mkdir(BIN_DIR, { recursive: true })

		const url = get_download_url(platform)

		spinner.text = `Downloading palacms for ${platform.os}/${platform.arch}...`

		// Download binary
		const response = await fetch(url)

		if (!response.ok) {
			throw new Error(`Download failed: ${response.status} ${response.statusText}`)
		}

		// Save to file
		const file_stream = createWriteStream(binary_path)
		await pipeline(response.body as any, file_stream)

		// Make executable
		await fs.chmod(binary_path, 0o755)

		spinner.succeed('Pala setup complete')
		return binary_path

	} catch (error) {
		spinner.fail('Setup failed')

		// Provide manual instructions
		console.log('')
		console.log(chalk.yellow('To install manually:'))
		console.log(chalk.dim('  1. Download palacms from https://github.com/palacms/palacms/releases'))
		console.log(chalk.dim(`  2. Place it in ${BIN_DIR}`))
		console.log(chalk.dim('  3. Make it executable: chmod +x palacms'))
		console.log('')

		throw error
	}
}

export async function get_binary_version(): Promise<string | null> {
	try {
		const binary_path = get_binary_path()
		const { execSync } = await import('child_process')
		const output = execSync(`"${binary_path}" --version`, { encoding: 'utf-8' })
		return output.trim()
	} catch {
		return null
	}
}
