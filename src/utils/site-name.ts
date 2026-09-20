/**
 * Derives a site's human-readable display name from its folder or hostname.
 *
 * - Dotted names use the first label: `example.com` → `Example`
 * - Hyphens, underscores, and spaces break words, and each word is
 *   capitalized: `harrow-stone` → `Harrow Stone`
 *
 * Shared by `primo new` (folder it creates) and `primo add` (existing folder)
 * so both produce the same name for the same input.
 */
export function derive_display_name(name: string): string {
	const base = name.includes('.') ? name.split('.')[0] : name
	return base
		.split(/[-_\s]+/)
		.filter((word) => word.length > 0)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
