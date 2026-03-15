<script>
let is_open = $state(false)
let is_editor = $state(false)

$effect(() => {
	if (typeof window !== 'undefined') {
		is_editor = window.__PALA_CONTEXT__?.environment === 'editor'
	}
})

function toggle_menu() {
	is_open = !is_open
}
</script>

<header class:in-editor={is_editor}>
	{#if show_topbar && (site.phone || site.email)}
		<div class="topbar">
			<div class="container">
				<div class="topbar-content">
					{#if site.phone}
						<a href="tel:{site.phone}" class="topbar-item">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
							{site.phone}
						</a>
					{/if}
					{#if site.email}
						<a href="mailto:{site.email}" class="topbar-item">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
							{site.email}
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<nav class="navbar">
		<div class="container">
			<a href="/" class="logo">
				{#if site.logo?.type === 'image' && site.logo?.image?.url}
					<img src={site.logo.image.url} alt={site.site_name} />
				{:else}
					<span class="logo-text">{site.logo?.text || site.site_name}</span>
				{/if}
			</a>

			<button class="mobile-toggle" onclick={toggle_menu} aria-label="Toggle menu">
				<span class="bar"></span>
				<span class="bar"></span>
				<span class="bar"></span>
			</button>

			<div class="nav-menu" class:open={is_open}>
				{#if site.nav_links?.length}
					<ul class="nav-links">
						{#each site.nav_links as item}
							<li>
								<a href={item.link?.url}>{item.link?.label}</a>
							</li>
						{/each}
					</ul>
				{/if}

				{#if site.header_cta?.url}
					<a href={site.header_cta.url} class="nav-cta">{site.header_cta.label}</a>
				{/if}
			</div>
		</div>
	</nav>
</header>

<style>
header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	background: var(--theme-background, #FDFBF7);
}

header.in-editor {
	position: relative;
}

.topbar {
	background: var(--theme-primary, #B8860B);
	color: white;
	padding: 0.5rem 0;
	font-size: 0.875rem;
}

.topbar .container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.topbar-content {
	display: flex;
	justify-content: flex-end;
	gap: 1.5rem;
}

.topbar-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: white;
	text-decoration: none;
	transition: opacity 0.2s;
}

.topbar-item:hover {
	opacity: 0.8;
}

.navbar {
	border-bottom: 1px solid var(--theme-border-color, #E8E0D0);
}

.navbar .container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 1rem 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.logo {
	text-decoration: none;
}

.logo img {
	height: 40px;
	width: auto;
}

.logo-text {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--theme-text, #1a1a1a);
}

.mobile-toggle {
	display: none;
	flex-direction: column;
	gap: 5px;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
}

.bar {
	width: 24px;
	height: 2px;
	background: var(--theme-text, #1a1a1a);
	transition: all 0.3s;
}

.nav-menu {
	display: flex;
	align-items: center;
	gap: 2rem;
}

.nav-links {
	display: flex;
	list-style: none;
	margin: 0;
	padding: 0;
	gap: 2rem;
}

.nav-links a {
	color: var(--theme-text, #1a1a1a);
	text-decoration: none;
	font-weight: 500;
	transition: color 0.2s;
}

.nav-links a:hover {
	color: var(--theme-primary, #B8860B);
}

.nav-cta {
	display: inline-block;
	background: var(--theme-primary, #B8860B);
	color: white;
	padding: 0.75rem 1.5rem;
	border-radius: 4px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
}

.nav-cta:hover {
	background: var(--theme-primary-dark, #8B6914);
}

@media (max-width: 768px) {
	.mobile-toggle {
		display: flex;
	}

	.nav-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--theme-background, #FDFBF7);
		flex-direction: column;
		padding: 1.5rem;
		border-bottom: 1px solid var(--theme-border-color, #E8E0D0);
		display: none;
	}

	.nav-menu.open {
		display: flex;
	}

	.nav-links {
		flex-direction: column;
		width: 100%;
		text-align: center;
	}

	.nav-cta {
		width: 100%;
		text-align: center;
	}
}
</style>
