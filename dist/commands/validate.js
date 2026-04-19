import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { load as load_yaml } from 'js-yaml';
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
];
const MAX_FIELDS_FILE_BYTES = 256 * 1024;
const MAX_TOTAL_FIELDS = 5000;
// Warn-only normalization - logs issues but doesn't modify files
export async function normalize_site(site_dir) {
    const warnings = [];
    const pages_dir = path.join(site_dir, 'pages');
    const homepage_path = path.join(pages_dir, 'index.yaml');
    try {
        await fs.access(homepage_path);
    }
    catch {
        throw new Error(`Missing required homepage file: pages/index.yaml`);
    }
    // Note: Missing IDs are normal for new entities - they will be assigned during import.
    // We only log the warnings array if other checks added warnings.
    if (warnings.length > 0) {
        for (const warning of warnings) {
            console.log(chalk.yellow(`  ⚠ ${warning}`));
        }
    }
}
async function parse_fields_file(file_path) {
    const stat = await fs.stat(file_path);
    if (stat.size > MAX_FIELDS_FILE_BYTES) {
        throw new Error(`fields file is too large (${stat.size} bytes). This usually indicates corrupted duplicated schema data.`);
    }
    const content = await fs.readFile(file_path, 'utf-8');
    const parsed = load_yaml(content);
    const total_fields = count_fields_recursive(get_fields_array(parsed));
    if (total_fields > MAX_TOTAL_FIELDS) {
        throw new Error(`fields file defines too many fields (${total_fields}). This usually indicates corrupted duplicated schema data.`);
    }
    return parsed;
}
function get_field_id(field) {
    return field?._id || field?.id;
}
function get_fields_array(data) {
    if (Array.isArray(data)) {
        return data;
    }
    if (data && typeof data === 'object' && Array.isArray(data.fields)) {
        return data.fields;
    }
    return [];
}
function count_fields_recursive(fields) {
    let count = 0;
    for (const field of fields) {
        count += 1;
        if (Array.isArray(field?.subfields)) {
            count += count_fields_recursive(field.subfields);
        }
    }
    return count;
}
function is_plain_object(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function validate_field_config(field, field_name, file_path) {
    const errors = [];
    if (!Object.prototype.hasOwnProperty.call(field, 'config')) {
        return errors;
    }
    const config = field.config;
    if (config === null || config === undefined) {
        return errors;
    }
    if (typeof config === 'string') {
        if (config.trim() === '') {
            errors.push({
                file: file_path,
                field: field_name,
                message: 'Deprecated empty string "config". Remove it or replace it with a config object.',
                severity: 'warning'
            });
            return errors;
        }
        errors.push({
            file: file_path,
            field: field_name,
            message: '"config" must be an object, null, or omitted',
            severity: 'error'
        });
        return errors;
    }
    if (!is_plain_object(config)) {
        errors.push({
            file: file_path,
            field: field_name,
            message: '"config" must be an object, null, or omitted',
            severity: 'error'
        });
    }
    return errors;
}
function collect_field_names(fields, names = new Set()) {
    for (const field of fields) {
        if (field?.name) {
            names.add(field.name);
        }
        if (Array.isArray(field?.subfields)) {
            collect_field_names(field.subfields, names);
        }
    }
    return names;
}
function validate_field_recursive(field, field_path, file_path, field_ids, field_names) {
    const errors = [];
    const field_id = get_field_id(field);
    const field_name = field.name || field_id || '(unnamed)';
    const display_name = field_path || field_name;
    // IDs are optional - they're assigned by the system during import.
    // Only check for duplicates if IDs are present.
    if (field_id) {
        if (field_ids.has(field_id)) {
            errors.push({
                file: file_path,
                field: display_name,
                message: `Duplicate field ID: "${field_id}"`,
                severity: 'error'
            });
        }
        field_ids.add(field_id);
    }
    if (!field.name) {
        errors.push({
            file: file_path,
            field: display_name,
            message: 'Missing required "name" field',
            severity: 'error'
        });
    }
    if (!field.label && field.type !== 'info') {
        errors.push({
            file: file_path,
            field: display_name,
            message: 'Missing "label" field',
            severity: 'warning'
        });
    }
    if (!field.type) {
        errors.push({
            file: file_path,
            field: display_name,
            message: 'Missing required "type" field',
            severity: 'error'
        });
        return errors;
    }
    if (!VALID_FIELD_TYPES.includes(field.type)) {
        errors.push({
            file: file_path,
            field: display_name,
            message: `Invalid field type: "${field.type}". Valid types: ${VALID_FIELD_TYPES.join(', ')}`,
            severity: 'error'
        });
    }
    errors.push(...validate_field_config(field, display_name, file_path));
    if (field.type === 'select') {
        errors.push(...validate_select_field(field, display_name, file_path));
    }
    if (field.parent && !field_names.has(field.parent)) {
        errors.push({
            file: file_path,
            field: display_name,
            message: `Parent field "${field.parent}" not found`,
            severity: 'error'
        });
    }
    if (Array.isArray(field.subfields)) {
        for (const subfield of field.subfields) {
            const subfield_name = subfield?.name || get_field_id(subfield) || '(unnamed subfield)';
            errors.push(...validate_field_recursive(subfield, `${display_name}.${subfield_name}`, file_path, field_ids, field_names));
        }
    }
    return errors;
}
export async function validate_site(options) {
    const errors = [];
    const warnings = [];
    const site_dir = path.resolve(options.dir);
    console.log(chalk.bold('\n🔍 Validating site structure...\n'));
    try {
        // Check if directory exists
        await fs.access(site_dir);
    }
    catch {
        console.log(chalk.red(`✖ Directory not found: ${site_dir}`));
        process.exit(1);
    }
    // Check for issues (warn-only, no modifications)
    await normalize_site(site_dir);
    // Validate blocks
    const blocks_errors = await validate_blocks(site_dir);
    errors.push(...blocks_errors.filter(e => e.severity === 'error'));
    warnings.push(...blocks_errors.filter(e => e.severity === 'warning'));
    // Validate page types
    const page_types_errors = await validate_page_types(site_dir);
    errors.push(...page_types_errors.filter(e => e.severity === 'error'));
    warnings.push(...page_types_errors.filter(e => e.severity === 'warning'));
    // Validate site fields
    const site_errors = await validate_site_fields(site_dir);
    errors.push(...site_errors.filter(e => e.severity === 'error'));
    warnings.push(...site_errors.filter(e => e.severity === 'warning'));
    // Validate pages
    const pages_errors = await validate_pages(site_dir);
    errors.push(...pages_errors.filter(e => e.severity === 'error'));
    warnings.push(...pages_errors.filter(e => e.severity === 'warning'));
    // Print results
    if (errors.length === 0 && warnings.length === 0) {
        console.log(chalk.green('✓ All validations passed!\n'));
        return;
    }
    if (warnings.length > 0) {
        console.log(chalk.yellow(`⚠ ${warnings.length} warning${warnings.length > 1 ? 's' : ''}:\n`));
        for (const warning of warnings) {
            print_error(warning);
        }
        console.log('');
    }
    if (errors.length > 0) {
        console.log(chalk.red(`✖ ${errors.length} error${errors.length > 1 ? 's' : ''}:\n`));
        for (const error of errors) {
            print_error(error);
        }
        console.log('');
        process.exit(1);
    }
}
async function validate_blocks(site_dir) {
    const errors = [];
    const blocks_dir = path.join(site_dir, 'blocks');
    try {
        await fs.access(blocks_dir);
    }
    catch {
        return [{
                file: 'blocks/',
                message: 'Blocks directory not found',
                severity: 'error'
            }];
    }
    const block_names = await fs.readdir(blocks_dir);
    for (const block_name of block_names) {
        if (block_name.startsWith('.'))
            continue;
        const block_dir = path.join(blocks_dir, block_name);
        const stat = await fs.stat(block_dir);
        if (!stat.isDirectory())
            continue;
        // Check for required files - read actual directory listing to handle case-insensitive filesystems
        const block_files = await fs.readdir(block_dir);
        const fields_path = path.join(block_dir, 'fields.yaml');
        // Check for component.svelte with correct casing
        const component_file = block_files.find(f => f.toLowerCase() === 'component.svelte');
        if (!component_file) {
            errors.push({
                file: `blocks/${block_name}/`,
                message: 'Missing component.svelte file',
                severity: 'error'
            });
        }
        else if (component_file !== 'component.svelte') {
            errors.push({
                file: `blocks/${block_name}/${component_file}`,
                message: `Filename must be lowercase: "component.svelte", not "${component_file}". The import will silently skip this block.`,
                severity: 'error'
            });
        }
        try {
            const relative_fields_path = `blocks/${block_name}/fields.yaml`;
            const fields_json = await parse_fields_file(fields_path);
            // Validate fields structure
            const field_errors = validate_fields(fields_json, relative_fields_path);
            errors.push(...field_errors);
        }
        catch {
            errors.push({
                file: `blocks/${block_name}/fields.yaml`,
                message: 'Missing fields.yaml file or invalid YAML syntax',
                severity: 'error'
            });
        }
    }
    return errors;
}
async function validate_page_types(site_dir) {
    const errors = [];
    const page_types_dir = path.join(site_dir, 'page-types');
    try {
        await fs.access(page_types_dir);
    }
    catch {
        return [{
                file: 'page-types/',
                message: 'Page types directory not found',
                severity: 'warning'
            }];
    }
    const page_type_names = await fs.readdir(page_types_dir);
    for (const page_type_name of page_type_names) {
        if (page_type_name.startsWith('.'))
            continue;
        const page_type_dir = path.join(page_types_dir, page_type_name);
        const stat = await fs.stat(page_type_dir);
        if (!stat.isDirectory())
            continue;
        const config_path = path.join(page_type_dir, 'config.yaml');
        try {
            const config_data = await fs.readFile(config_path, 'utf-8');
            let config;
            try {
                config = load_yaml(config_data);
            }
            catch {
                errors.push({
                    file: `page-types/${page_type_name}/config.yaml`,
                    message: 'Invalid YAML syntax',
                    severity: 'error'
                });
                continue;
            }
            // Validate config has required fields
            if (!config.name) {
                errors.push({
                    file: `page-types/${page_type_name}/config.yaml`,
                    message: 'Missing "name" field',
                    severity: 'error'
                });
            }
            // Validate page type fields if they exist
            if (config.fields) {
                const field_errors = validate_fields({ fields: config.fields }, `page-types/${page_type_name}/config.yaml`);
                errors.push(...field_errors);
            }
        }
        catch {
            errors.push({
                file: `page-types/${page_type_name}/`,
                message: 'Missing config.yaml file',
                severity: 'error'
            });
        }
    }
    return errors;
}
async function validate_site_fields(site_dir) {
    const errors = [];
    const site_fields_path = path.join(site_dir, 'site', 'fields.yaml');
    try {
        const relative_path = 'site/fields.yaml';
        const fields_json = await parse_fields_file(site_fields_path);
        // site fields must be a plain array, not wrapped in an object
        if (!Array.isArray(fields_json)) {
            errors.push({
                file: relative_path,
                message: 'Must be a plain array (e.g., []) not wrapped in an object. The import will fail.',
                severity: 'error'
            });
            return errors;
        }
        // Validate as array of fields
        if (fields_json.length > 0) {
            const field_errors = validate_fields({ fields: fields_json }, relative_path);
            errors.push(...field_errors);
        }
    }
    catch {
        errors.push({
            file: 'site/fields.yaml',
            message: 'Missing fields.yaml file or invalid YAML syntax',
            severity: 'warning'
        });
    }
    return errors;
}
function validate_fields(fields_json, file_path) {
    const errors = [];
    if (!fields_json.fields || !Array.isArray(fields_json.fields)) {
        errors.push({
            file: file_path,
            message: 'Missing or invalid "fields" array',
            severity: 'error'
        });
        return errors;
    }
    const field_ids = new Set();
    const field_names = collect_field_names(fields_json.fields);
    for (const field of fields_json.fields) {
        errors.push(...validate_field_recursive(field, field.name || get_field_id(field) || '(unnamed)', file_path, field_ids, field_names));
    }
    return errors;
}
function validate_select_field(field, field_name, file_path) {
    const errors = [];
    if (!is_plain_object(field.config) || !field.config.options) {
        errors.push({
            file: file_path,
            field: field_name,
            message: 'Select field missing "config.options" array',
            severity: 'error'
        });
        return errors;
    }
    if (!Array.isArray(field.config.options)) {
        errors.push({
            file: file_path,
            field: field_name,
            message: 'Select field "config.options" must be an array',
            severity: 'error'
        });
        return errors;
    }
    for (let i = 0; i < field.config.options.length; i++) {
        const option = field.config.options[i];
        if (!option.label) {
            errors.push({
                file: file_path,
                field: field_name,
                message: `Option ${i + 1} missing "label" property`,
                severity: 'error'
            });
        }
        if (!option.value) {
            errors.push({
                file: file_path,
                field: field_name,
                message: `Option ${i + 1} missing "value" property`,
                severity: 'error'
            });
        }
        if (!('icon' in option)) {
            errors.push({
                file: file_path,
                field: field_name,
                message: `Option ${i + 1} missing "icon" property (can be empty string)`,
                severity: 'error'
            });
        }
    }
    return errors;
}
async function validate_pages(site_dir) {
    const errors = [];
    const pages_dir = path.join(site_dir, 'pages');
    const homepage_path = path.join(pages_dir, 'index.yaml');
    try {
        await fs.access(pages_dir);
    }
    catch {
        return [{
                file: 'pages/',
                message: 'Pages directory not found',
                severity: 'warning'
            }];
    }
    try {
        await fs.access(homepage_path);
    }
    catch {
        errors.push({
            file: 'pages/index.yaml',
            message: 'Missing required homepage file. Primo requires pages/index.yaml for the site root.',
            severity: 'error'
        });
    }
    // Recursively find all YAML files in pages directory
    const yaml_files = await find_yaml_files(pages_dir, 'pages');
    for (const yaml_file of yaml_files) {
        const file_path = path.join(site_dir, yaml_file);
        try {
            const content = await fs.readFile(file_path, 'utf-8');
            if (/^slug:/m.test(content)) {
                errors.push({
                    file: yaml_file,
                    message: 'Page slug is now derived from the file path. Remove the "slug:" field; it is ignored.',
                    severity: 'warning'
                });
            }
            // Check for common mistakes
            if (content.includes('\nblocks:') || content.match(/^blocks:/m)) {
                errors.push({
                    file: yaml_file,
                    message: 'Page uses "blocks:" but should use "sections:" with nested "content" objects. The import will fail.',
                    severity: 'error'
                });
            }
            // Check that sections have the correct structure
            if (content.includes('\nsections:') || content.match(/^sections:/m)) {
                // Basic check: sections should have "block:" and "content:" keys
                const lines = content.split('\n');
                let in_sections = false;
                let found_block = false;
                let found_content = false;
                for (const line of lines) {
                    if (line.match(/^sections:/)) {
                        in_sections = true;
                    }
                    else if (in_sections && line.match(/^\s+- block:/)) {
                        found_block = true;
                    }
                    else if (in_sections && line.match(/^\s+content:/)) {
                        found_content = true;
                    }
                    else if (in_sections && line.match(/^[a-z]/)) {
                        // New top-level key, end of sections
                        in_sections = false;
                    }
                }
                if (found_block && !found_content) {
                    errors.push({
                        file: yaml_file,
                        message: 'Sections missing "content:" key. Each section should have "block:" and "content:" keys.',
                        severity: 'warning'
                    });
                }
            }
        }
        catch (err) {
            errors.push({
                file: yaml_file,
                message: `Failed to read file: ${err}`,
                severity: 'error'
            });
        }
    }
    return errors;
}
async function find_yaml_files(dir, relative_path) {
    const files = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.'))
                continue;
            const full_path = path.join(dir, entry.name);
            const rel_path = path.join(relative_path, entry.name);
            if (entry.isDirectory()) {
                const nested = await find_yaml_files(full_path, rel_path);
                files.push(...nested);
            }
            else if (entry.name.endsWith('.yaml')) {
                files.push(rel_path);
            }
        }
    }
    catch {
        // Directory doesn't exist or not readable
    }
    return files;
}
function print_error(error) {
    const icon = error.severity === 'error' ? chalk.red('✖') : chalk.yellow('⚠');
    const location = error.field
        ? `${error.file} → ${chalk.bold(error.field)}`
        : error.file;
    console.log(`  ${icon} ${chalk.dim(location)}`);
    console.log(`    ${error.message}`);
}
