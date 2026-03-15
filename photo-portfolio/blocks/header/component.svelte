<script>
	let is_open = $state(false)
	let is_scrolled = $state(false)

	$effect(() => {
		if (typeof window !== 'undefined') {
			const handle_scroll = () => {
				is_scrolled = window.scrollY > 50
			}
			window.addEventListener('scroll', handle_scroll)
			return () => window.removeEventListener('scroll', handle_scroll)
		}
	})

	function toggle_menu() {
		is_open = !is_open
	}
</script>

<header class:scrolled={is_scrolled}>
	<div class="header-container">
		<a href="/" class="logo">
			{#if site?.logo?.type === 'image' && site?.logo?.image?.url}
				<img src={site.logo.image.url} alt={site.logo.image.alt || site.site_name} />
			{:else}
				<span>{site?.logo?.text || site?.site_name || 'LUMEN'}</span>
			{/if}
		</a>

		<nav class:open={is_open}>
			{#if site?.nav_links?.length}
				{#each site.nav_links as nav_item}
					{#if nav_item.link?.url}
						<a href={nav_item.link.url} onclick={() => is_open = false}>
							{nav_item.link.label}
						</a>
					{/if}
				{/each}
			{/if}
		</nav>

		{#if site?.header_cta?.url}
			<a href={site.header_cta.url} class="header-cta">
				{site.header_cta.label}
			</a>
		{/if}

		<button class="menu-toggle" onclick={toggle_menu} aria-label="Toggle menu">
			<span class:open={is_open}></span>
		</button>
	</div>
</header>

<style>
header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	padding: 1.5rem 0;
	transition: all 0.3s ease;
}

header.scrolled {
	background: rgba(10, 10, 10, 0.95);
	backdrop-filter: blur(10px);
	padding: 1rem 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-container {
	max-width: 1400px;
	margin: 0 auto;
	padding: 0 2rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.logo {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: 1.5rem;
	font-weight: 700;
	color: white;
	text-decoration: none;
	letter-spacing: 0.2em;
	text-transform: uppercase;
}

.logo img {
	height: 40px;
	width: auto;
}

nav {
	display: flex;
	gap: 2.5rem;
}

nav a {
	color: rgba(255, 255, 255, 0.8);
	text-decoration: none;
	font-size: 0.875rem;
	font-weight: 500;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	transition: color 0.3s ease;
}

nav a:hover {
	color: white;
}

.header-cta {
	display: inline-flex;
	align-items: center;
	background: transparent;
	color: white;
	padding: 0.75rem 1.5rem;
	border: 1px solid rgba(255, 255, 255, 0.3);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	text-decoration: none;
	transition: all 0.3s ease;
}

.header-cta:hover {
	background: white;
	color: #0a0a0a;
}

.menu-toggle {
	display: none;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
	z-index: 1001;
}

.menu-toggle span {
	display: block;
	width: 24px;
	height: 2px;
	background: white;
	position: relative;
	transition: all 0.3s ease;
}

.menu-toggle span::before,
.menu-toggle span::after {
	content: '';
	position: absolute;
	width: 24px;
	height: 2px;
	background: white;
	transition: all 0.3s ease;
}

.menu-toggle span::before {
	top: -8px;
}

.menu-toggle span::after {
	bottom: -8px;
}

.menu-toggle span.open {
	background: transparent;
}

.menu-toggle span.open::before {
	top: 0;
	transform: rotate(45deg);
}

.menu-toggle span.open::after {
	bottom: 0;
	transform: rotate(-45deg);
}

@media (max-width: 900px) {
	.menu-toggle {
		display: block;
	}

	.header-cta {
		display: none;
	}

	nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(10, 10, 10, 0.98);
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		transform: translateX(100%);
		transition: transform 0.3s ease;
	}

	nav.open {
		transform: translateX(0);
	}

	nav a {
		font-size: 1.25rem;
	}
}
</style>
