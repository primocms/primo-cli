import { parse } from 'svelte/compiler'

interface HeadSvelteViolation {
	tag: string
	line?: number
	column?: number
	message: string
}

export function validate_head_svelte_content(source: string, file_path = 'site/head.svelte'): void {
	const error = get_head_svelte_validation_error(source, file_path)
	if (error) {
		throw new Error(error)
	}
}

export function get_head_svelte_validation_error(source: string, file_path = 'site/head.svelte'): string | null {
	const duplicate_head = find_duplicate_head(source)
	if (duplicate_head) {
		return format_violation(file_path, duplicate_head)
	}

	try {
		parse(`<svelte:head>${source}</svelte:head>`, { modern: true })
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		return `${file_path} has invalid Svelte syntax: ${message}`
	}

	return null
}

function find_duplicate_head(source: string): HeadSvelteViolation | null {
	const source_without_comments = source.replace(/<!--[\s\S]*?-->/g, (comment) => ' '.repeat(comment.length))
	const match = /<\s*svelte:head\b/i.exec(source_without_comments)

	if (!match) {
		return null
	}

	return {
		tag: '<svelte:head>',
		message: 'remove the wrapper.',
		...offset_to_line_column(source, match.index)
	}
}

function format_violation(file_path: string, violation: HeadSvelteViolation): string {
	const location = violation.line
		? `${file_path}:${violation.line}:${violation.column || 1}`
		: file_path

	return `${location} contains ${violation.tag}. ${file_path} is injected into <svelte:head>; ${violation.message} Keep only head children such as <title>, <meta>, <link>, <script>, and <style>.`
}

function offset_to_line_column(source: string, offset: number): { line: number; column: number } {
	let line = 1
	let column = 1

	for (let i = 0; i < offset; i++) {
		if (source[i] === '\n') {
			line += 1
			column = 1
		} else {
			column += 1
		}
	}

	return { line, column }
}
