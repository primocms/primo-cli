<script>
let is_editor = $state(false)
let is_scrolled = $state(false)
let mobile_open = $state(false)

$effect(() => {
	if (typeof window !== 'undefined') {
		is_editor = window.__PALA_CONTEXT__?.environment === 'editor'

		const handle_scroll = () => {
			is_scrolled = window.scrollY > 20
		}

		window.addEventListener('scroll', handle_scroll)
		return () => window.removeEventListener('scroll', handle_scroll)
	}
})

function toggle_mobile() {
	mobile_open = !mobile_open
}

function close_mobile() {
	mobile_open = false
}
</script>

<header class:sticky class:scrolled={is_scrolled} class:in-editor={is_editor}>
	<div class="header-container">
		<a href="/" class="logo">
			{#if $site?.logo?.type === 'image' && $site.logo.image?.url}
				<img src={$site.logo.image.url} alt={$site.site_name || 'Logo'} />
			{:else}
				<span class="logo-text">{$site?.logo?.text || $site?.site_name || 'JR'}</span>
			{/if}
		</a>

		<nav class:open={mobile_open}>
			{#if $site?.nav_links?.length}
				{#each $site.nav_links as nav_item}
					<a href={nav_item.link?.url} onclick={close_mobile}>{nav_item.link?.label}</a>
				{/each}
			{/if}

			{#if cta?.url}
				<a href={cta.url} class="cta-btn">{cta.label}</a>
			{/if}
		</nav>

		<button class="mobile-toggle" onclick={toggle_mobile} aria-label="Toggle menu">
			<span class:open={mobile_open}></span>
		</button>
	</div>
</header>

<style>
header {
	position: relative;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	padding: 1.25rem 0;
	transition: all 0.3s ease;
}

header.sticky {
	position: fixed;
}

header.in-editor {
	position: relative;
}

header.scrolled {
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(10px);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.header-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.logo {
	display: flex;
	align-items: center;
	text-decoration: none;
}

.logo img {
	height: 40px;
	width: auto;
}

.logo-text {
	font-size: 1.5rem;
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	letter-spacing: -0.03em;
}

nav {
	display: flex;
	align-items: center;
	gap: 2rem;
}

nav a {
	font-size: 0.9375rem;
	font-weight: 500;
	color: var(--theme-text-muted, #64748b);
	text-decoration: none;
	transition: color 0.2s ease;
}

nav a:hover {
	color: var(--theme-text, #0f172a);
}

.cta-btn {
	background: var(--theme-primary, #0f172a) !important;
	color: white !important;
	padding: 0.625rem 1.25rem;
	border-radius: 8px;
	font-weight: 600 !important;
}

.cta-btn:hover {
	background: var(--theme-primary-dark, #1e293b) !important;
}

.mobile-toggle {
	display: none;
	background: none;
	border: none;
	width: 32px;
	height: 32px;
	cursor: pointer;
	position: relative;
}

.mobile-toggle span {
	position: absolute;
	width: 20px;
	height: 2px;
	background: var(--theme-text, #0f172a);
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	transition: all 0.3s ease;
}

.mobile-toggle span::before,
.mobile-toggle span::after {
	content: '';
	position: absolute;
	width: 20px;
	height: 2px;
	background: var(--theme-text, #0f172a);
	left: 0;
	transition: all 0.3s ease;
}

.mobile-toggle span::before {
	top: -6px;
}

.mobile-toggle span::after {
	top: 6px;
}

.mobile-toggle span.open {
	background: transparent;
}

.mobile-toggle span.open::before {
	transform: rotate(45deg);
	top: 0;
}

.mobile-toggle span.open::after {
	transform: rotate(-45deg);
	top: 0;
}

@media (max-width: 768px) {
	.mobile-toggle {
		display: block;
	}

	nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: white;
		flex-direction: column;
		justify-content: center;
		gap: 2rem;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
	}

	nav.open {
		opacity: 1;
		visibility: visible;
	}

	nav a {
		font-size: 1.5rem;
	}
}
</style>
