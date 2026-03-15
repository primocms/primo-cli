<script>
let is_editor = $state(false)
let mobile_open = $state(false)
let scrolled = $state(false)

$effect(() => {
	if (typeof window !== 'undefined') {
		is_editor = window.__PALA_CONTEXT__?.environment === 'editor'

		const handle_scroll = () => {
			scrolled = window.scrollY > 20
		}

		window.addEventListener('scroll', handle_scroll)
		handle_scroll()

		return () => {
			window.removeEventListener('scroll', handle_scroll)
		}
	}
})

function toggle_mobile() {
	mobile_open = !mobile_open
}
</script>

{#if announcement}
	<div class="announcement-bar">
		<div class="container">
			{#if announcement_link?.url}
				<a href={announcement_link.url}>
					{announcement}
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
				</a>
			{:else}
				<span>{announcement}</span>
			{/if}
		</div>
	</div>
{/if}

<header class:scrolled class:in-editor={is_editor}>
	<div class="container">
		<a href="/" class="logo">
			{#if $site?.logo?.type === 'image' && $site?.logo?.image?.url}
				<img src={$site.logo.image.url} alt={$site.logo.image.alt || $site.site_name} />
			{:else}
				<span>{$site?.logo?.text || $site?.site_name || 'Agency'}</span>
			{/if}
		</a>

		<nav class:open={mobile_open}>
			{#if $site?.nav_links?.length}
				{#each $site.nav_links as nav_item}
					<a href={nav_item.link?.url} class="nav-link">{nav_item.link?.label}</a>
				{/each}
			{/if}

			{#if $site?.header_cta?.url}
				<a href={$site.header_cta.url} class="btn-cta mobile-cta">{$site.header_cta.label}</a>
			{/if}
		</nav>

		<div class="header-actions">
			{#if $site?.header_cta?.url}
				<a href={$site.header_cta.url} class="btn-cta desktop-cta">{$site.header_cta.label}</a>
			{/if}

			<button class="mobile-toggle" onclick={toggle_mobile} aria-label="Toggle menu">
				{#if mobile_open}
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
				{/if}
			</button>
		</div>
	</div>
</header>

<style>
.announcement-bar {
	background: var(--theme-primary, #f97316);
	color: white;
	padding: 0.5rem 0;
	font-size: 0.875rem;
	text-align: center;
}

.announcement-bar a {
	color: white;
	text-decoration: none;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-weight: 500;
}

.announcement-bar a:hover {
	text-decoration: underline;
}

header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	padding: 1rem 0;
	transition: all 0.3s ease;
}

header.scrolled {
	background: rgba(10, 10, 10, 0.95);
	backdrop-filter: blur(10px);
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

header.in-editor {
	position: relative;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.logo {
	text-decoration: none;
	display: flex;
	align-items: center;
}

.logo img {
	height: 32px;
	width: auto;
}

.logo span {
	font-size: 1.375rem;
	font-weight: 800;
	color: white;
	letter-spacing: -0.02em;
}

nav {
	display: flex;
	align-items: center;
	gap: 2rem;
}

.nav-link {
	font-size: 0.9375rem;
	font-weight: 500;
	color: rgba(255, 255, 255, 0.8);
	text-decoration: none;
	transition: color 0.2s ease;
}

.nav-link:hover {
	color: white;
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.btn-cta {
	background: var(--theme-primary, #f97316);
	color: white;
	padding: 0.625rem 1.25rem;
	border-radius: 6px;
	font-size: 0.875rem;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
}

.btn-cta:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
}

.mobile-cta {
	display: none;
}

.mobile-toggle {
	display: none;
	background: none;
	border: none;
	color: white;
	padding: 0.5rem;
	cursor: pointer;
}

@media (max-width: 768px) {
	.desktop-cta {
		display: none;
	}

	.mobile-toggle {
		display: block;
	}

	nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(10, 10, 10, 0.98);
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

	.nav-link {
		font-size: 1.5rem;
	}

	.mobile-cta {
		display: inline-flex;
		margin-top: 1rem;
	}
}
</style>
