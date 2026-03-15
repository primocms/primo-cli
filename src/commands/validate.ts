import fs from 'fs/promises'
import path from 'path'
import chalk from 'chalk'

interface ValidationError {
	file: string
	line?: number
	field?: string
	message: string
	severity: 'error' | 'warning'
}

interface ValidateOptions {
	dir: string
	strict?: boolean
}

const VALID_FIELD_TYPES = [
	'text',
	'rich-text',
	'markdown',
	'image',
	'link',
	'url',
	'icon',
	'number',
	'switch',
	'select',
	'repeater',
	'group',
	'page',
	'page-list',
	'page-field',
	'site-field',
	'slider',
	'date',
	'info'
]

export async function validate_site(options: ValidateOptions) {
	const errors: ValidationError[] = []
	const warnings: ValidationError[] = []
	const site_dir = path.resolve(options.dir)

	console.log(chalk.bold('\n🔍 Validating site structure...\n'))

	try {
		// Check if directory exists
		await fs.access(site_dir)
	} catch {
		console.log(chalk.red(`✖ Directory not found: ${site_dir}`))
		process.exit(1)
	}

	// Validate blocks
	const blocks_errors = await validate_blocks(site_dir)
	errors.push(...blocks_errors.filter(e => e.severity === 'error'))
	warnings.push(...blocks_errors.filter(e => e.severity === 'warning'))

	// Validate page types
	const page_types_errors = await validate_page_types(site_dir)
	errors.push(...page_types_errors.filter(e => e.severity === 'error'))
	warnings.push(...page_types_errors.filter(e => e.severity === 'warning'))

	// Validate site fields
	const site_errors = await validate_site_fields(site_dir)
	errors.push(...site_errors.filter(e => e.severity === 'error'))
	warnings.push(...site_errors.filter(e => e.severity === 'warning'))

	// Validate pages
	const pages_errors = await validate_pages(site_dir)
	errors.push(...pages_errors.filter(e => e.severity === 'error'))
	warnings.push(...pages_errors.filter(e => e.severity === 'warning'))

	// Print results
	if (errors.length === 0 && warnings.length === 0) {
		console.log(chalk.green('✓ All validations passed!\n'))
		return
	}

	if (warnings.length > 0) {
		console.log(chalk.yellow(`⚠ ${warnings.length} warning${warnings.length > 1 ? 's' : ''}:\n`))
		for (const warning of warnings) {
			print_error(warning)
		}
		console.log('')
	}

	if (errors.length > 0) {
		console.log(chalk.red(`✖ ${errors.length} error${errors.length > 1 ? 's' : ''}:\n`))
		for (const error of errors) {
			print_error(error)
		}
		console.log('')
		process.exit(1)
	}
}

async function validate_blocks(site_dir: string): Promise<ValidationError[]> {
	const errors: ValidationError[] = []
	const blocks_dir = path.join(site_dir, 'blocks')

	try {
		await fs.access(blocks_dir)
	} catch {
		return [{
			file: 'blocks/',
			message: 'Blocks directory not found',
			severity: 'error'
		}]
	}

	const block_names = await fs.readdir(blocks_dir)

	for (const block_name of block_names) {
		if (block_name.startsWith('.')) continue

		const block_dir = path.join(blocks_dir, block_name)
		const stat = await fs.stat(block_dir)
		if (!stat.isDirectory()) continue

		// Check for required files - read actual directory listing to handle case-insensitive filesystems
		const fields_path = path.join(block_dir, 'fields.json')
		const block_files = await fs.readdir(block_dir)

		// Check for component.svelte with correct casing
		const component_file = block_files.find(f => f.toLowerCase() === 'component.svelte')
		if (!component_file) {
			errors.push({
				file: `blocks/${block_name}/`,
				message: 'Missing component.svelte file',
				severity: 'error'
			})
		} else if (component_file !== 'component.svelte') {
			errors.push({
				file: `blocks/${block_name}/${component_file}`,
				message: `Filename must be lowercase: "component.svelte", not "${component_file}". The import will silently skip this block.`,
				severity: 'error'
			})
		}

		try {
			const fields_data = await fs.readFile(fields_path, 'utf-8')
			let fields_json: any

			try {
				fields_json = JSON.parse(fields_data)
			} catch {
				errors.push({
					file: `blocks/${block_name}/fields.json`,
					message: 'Invalid JSON syntax',
					severity: 'error'
				})
				continue
			}

			// Validate fields structure
			const field_errors = validate_fields(fields_json, `blocks/${block_name}/fields.json`)
			errors.push(...field_errors)

		} catch {
			errors.push({
				file: `blocks/${block_name}/`,
				message: 'Missing fields.json file',
				severity: 'error'
			})
		}
	}

	return errors
}

async function validate_page_types(site_dir: string): Promise<ValidationError[]> {
	const errors: ValidationError[] = []
	const page_types_dir = path.join(site_dir, 'page-types')

	try {
		await fs.access(page_types_dir)
	} catch {
		return [{
			file: 'page-types/',
			message: 'Page types directory not found',
			severity: 'warning'
		}]
	}

	const page_type_names = await fs.readdir(page_types_dir)

	for (const page_type_name of page_type_names) {
		if (page_type_name.startsWith('.')) continue

		const page_type_dir = path.join(page_types_dir, page_type_name)
		const stat = await fs.stat(page_type_dir)
		if (!stat.isDirectory()) continue

		const config_path = path.join(page_type_dir, 'config.json')

		try {
			const config_data = await fs.readFile(config_path, 'utf-8')
			let config: any

			try {
				config = JSON.parse(config_data)
			} catch {
				errors.push({
					file: `page-types/${page_type_name}/config.json`,
					message: 'Invalid JSON syntax',
					severity: 'error'
				})
				continue
			}

			// Validate config has required fields
			if (!config.name) {
				errors.push({
					file: `page-types/${page_type_name}/config.json`,
					message: 'Missing "name" field',
					severity: 'error'
				})
			}

			// Validate page type fields if they exist
			if (config.fields) {
				const field_errors = validate_fields(
					{ fields: config.fields },
					`page-types/${page_type_name}/config.json`
				)
				errors.push(...field_errors)
			}

		} catch {
			errors.push({
				file: `page-types/${page_type_name}/`,
				message: 'Missing config.json file',
				severity: 'error'
			})
		}
	}

	return errors
}

async function validate_site_fields(site_dir: string): Promise<ValidationError[]> {
	const errors: ValidationError[] = []
	const site_fields_path = path.join(site_dir, 'site/fields.json')

	try {
		const fields_data = await fs.readFile(site_fields_path, 'utf-8')
		let fields_json: any

		try {
			fields_json = JSON.parse(fields_data)
		} catch {
			errors.push({
				file: 'site/fields.json',
				message: 'Invalid JSON syntax',
				severity: 'error'
			})
			return errors
		}

		// site/fields.json must be a plain array, not wrapped in an object
		if (!Array.isArray(fields_json)) {
			errors.push({
				file: 'site/fields.json',
				message: 'Must be a plain array (e.g., []) not wrapped in an object. The import will fail.',
				severity: 'error'
			})
			return errors
		}

		// Validate as array of fields
		if (fields_json.length > 0) {
			const field_errors = validate_fields({ fields: fields_json }, 'site/fields.json')
			errors.push(...field_errors)
		}

	} catch {
		errors.push({
			file: 'site/',
			message: 'Missing fields.json file',
			severity: 'warning'
		})
	}

	return errors
}

function validate_fields(fields_json: any, file_path: string): ValidationError[] {
	const errors: ValidationError[] = []

	if (!fields_json.fields || !Array.isArray(fields_json.fields)) {
		errors.push({
			file: file_path,
			message: 'Missing or invalid "fields" array',
			severity: 'error'
		})
		return errors
	}

	const field_ids = new Set<string>()
	const field_names = new Set<string>()
	const parent_names = new Set<string>()

	// Collect all field names for parent validation
	for (const field of fields_json.fields) {
		if (field.name) {
			field_names.add(field.name)
		}
	}

	for (const field of fields_json.fields) {
		const field_name = field.name || field.id || '(unnamed)'

		// Check required properties
		if (!field.id) {
			errors.push({
				file: file_path,
				field: field_name,
				message: 'Missing required "id" field',
				severity: 'error'
			})
		} else {
			// Check for duplicate IDs
			if (field_ids.has(field.id)) {
				errors.push({
					file: file_path,
					field: field_name,
					message: `Duplicate field ID: "${field.id}"`,
					severity: 'error'
				})
			}
			field_ids.add(field.id)
		}

		if (!field.name) {
			errors.push({
				file: file_path,
				field: field_name,
				message: 'Missing required "name" field',
				severity: 'error'
			})
		}

		if (!field.label && field.type !== 'info') {
			errors.push({
				file: file_path,
				field: field_name,
				message: 'Missing "label" field',
				severity: 'warning'
			})
		}

		if (!field.type) {
			errors.push({
				file: file_path,
				field: field_name,
				message: 'Missing required "type" field',
				severity: 'error'
			})
		} else {
			// Check valid field type
			if (!VALID_FIELD_TYPES.includes(field.type)) {
				errors.push({
					file: file_path,
					field: field_name,
					message: `Invalid field type: "${field.type}". Valid types: ${VALID_FIELD_TYPES.join(', ')}`,
					severity: 'error'
				})
			}

			// Type-specific validation
			if (field.type === 'select') {
				const select_errors = validate_select_field(field, field_name, file_path)
				errors.push(...select_errors)
			}

			if (field.type === 'repeater' || field.type === 'group') {
				parent_names.add(field.name)
			}
		}

		// Validate parent reference
		if (field.parent) {
			if (!field_names.has(field.parent)) {
				errors.push({
					file: file_path,
					field: field_name,
					message: `Parent field "${field.parent}" not found`,
					severity: 'error'
				})
			}
		}
	}

	return errors
}

function validate_select_field(field: any, field_name: string, file_path: string): ValidationError[] {
	const errors: ValidationError[] = []

	if (!field.options || !field.options.options) {
		errors.push({
			file: file_path,
			field: field_name,
			message: 'Select field missing "options.options" array',
			severity: 'error'
		})
		return errors
	}

	if (!Array.isArray(field.options.options)) {
		errors.push({
			file: file_path,
			field: field_name,
			message: 'Select field "options.options" must be an array',
			severity: 'error'
		})
		return errors
	}

	for (let i = 0; i < field.options.options.length; i++) {
		const option = field.options.options[i]

		if (!option.label) {
			errors.push({
				file: file_path,
				field: field_name,
				message: `Option ${i + 1} missing "label" property`,
				severity: 'error'
			})
		}

		if (!option.value) {
			errors.push({
				file: file_path,
				field: field_name,
				message: `Option ${i + 1} missing "value" property`,
				severity: 'error'
			})
		}

		if (!('icon' in option)) {
			errors.push({
				file: file_path,
				field: field_name,
				message: `Option ${i + 1} missing "icon" property (can be empty string)`,
				severity: 'error'
			})
		}
	}

	return errors
}

async function validate_pages(site_dir: string): Promise<ValidationError[]> {
	const errors: ValidationError[] = []
	const pages_dir = path.join(site_dir, 'pages')

	try {
		await fs.access(pages_dir)
	} catch {
		return [{
			file: 'pages/',
			message: 'Pages directory not found',
			severity: 'warning'
		}]
	}

	// Recursively find all YAML files in pages directory
	const yaml_files = await find_yaml_files(pages_dir, 'pages')

	for (const yaml_file of yaml_files) {
		const file_path = path.join(site_dir, yaml_file)

		try {
			const content = await fs.readFile(file_path, 'utf-8')

			// Check for common mistakes
			if (content.includes('\nblocks:') || content.match(/^blocks:/m)) {
				errors.push({
					file: yaml_file,
					message: 'Page uses "blocks:" but should use "sections:" with nested "content" objects. The import will fail.',
					severity: 'error'
				})
			}

			// Check that sections have the correct structure
			if (content.includes('\nsections:') || content.match(/^sections:/m)) {
				// Basic check: sections should have "block:" and "content:" keys
				const lines = content.split('\n')
				let in_sections = false
				let found_block = false
				let found_content = false

				for (const line of lines) {
					if (line.match(/^sections:/)) {
						in_sections = true
					} else if (in_sections && line.match(/^\s+- block:/)) {
						found_block = true
					} else if (in_sections && line.match(/^\s+content:/)) {
						found_content = true
					} else if (in_sections && line.match(/^[a-z]/)) {
						// New top-level key, end of sections
						in_sections = false
					}
				}

				if (found_block && !found_content) {
					errors.push({
						file: yaml_file,
						message: 'Sections missing "content:" key. Each section should have "block:" and "content:" keys.',
						severity: 'warning'
					})
				}
			}

		} catch (err) {
			errors.push({
				file: yaml_file,
				message: `Failed to read file: ${err}`,
				severity: 'error'
			})
		}
	}

	return errors
}

async function find_yaml_files(dir: string, relative_path: string): Promise<string[]> {
	const files: string[] = []

	try {
		const entries = await fs.readdir(dir, { withFileTypes: true })

		for (const entry of entries) {
			if (entry.name.startsWith('.')) continue

			const full_path = path.join(dir, entry.name)
			const rel_path = path.join(relative_path, entry.name)

			if (entry.isDirectory()) {
				const nested = await find_yaml_files(full_path, rel_path)
				files.push(...nested)
			} else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
				files.push(rel_path)
			}
		}
	} catch {
		// Directory doesn't exist or not readable
	}

	return files
}

function print_error(error: ValidationError) {
	const icon = error.severity === 'error' ? chalk.red('✖') : chalk.yellow('⚠')
	const location = error.field
		? `${error.file} → ${chalk.bold(error.field)}`
		: error.file

	console.log(`  ${icon} ${chalk.dim(location)}`)
	console.log(`    ${error.message}`)
}
