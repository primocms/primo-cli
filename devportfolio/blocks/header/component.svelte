<script>
let is_open = $state(false)
let is_scrolled = $state(false)

$effect(() => {
	if (typeof window !== 'undefined') {
		const handle_scroll = () => {
			is_scrolled = window.scrollY > 20
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
			{#if $site?.logo?.type === 'image' && $site?.logo?.image?.url}
				<img src={$site.logo.image.url} alt={$site.site_name} />
			{:else}
				<span class="logo-text">{$site?.logo?.text || $site?.site_name || 'Portfolio'}</span>
			{/if}
		</a>

		<nav class:open={is_open}>
			{#if $site?.nav_links?.length}
				{#each $site.nav_links as item}
					{#if item.link?.url}
						<a href={item.link.url} class="nav-link">{item.link.label}</a>
					{/if}
				{/each}
			{/if}
		</nav>

		<div class="header-actions">
			{#if $site?.header_cta?.url}
				<a href={$site.header_cta.url} class="cta-btn">{$site.header_cta.label}</a>
			{/if}

			<button class="menu-toggle" onclick={toggle_menu} aria-label="Toggle menu">
				<span class="bar" class:open={is_open}></span>
				<span class="bar" class:open={is_open}></span>
				<span class="bar" class:open={is_open}></span>
			</button>
		</div>
	</div>
</header>

<style>
header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	padding: 1rem 0;
	transition: all 0.3s ease;
}

header.scrolled {
	background: rgba(15, 23, 42, 0.95);
	backdrop-filter: blur(12px);
	padding: 0.75rem 0;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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
	text-decoration: none;
	font-size: 1.5rem;
	font-weight: 800;
	color: white;
	letter-spacing: -0.02em;
}

.logo img {
	height: 40px;
	width: auto;
}

.logo-text {
	background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

nav {
	display: flex;
	gap: 2rem;
}

.nav-link {
	color: #94a3b8;
	text-decoration: none;
	font-weight: 500;
	font-size: 0.9375rem;
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

.cta-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	padding: 0.625rem 1.25rem;
	border-radius: 8px;
	font-weight: 600;
	font-size: 0.875rem;
	text-decoration: none;
	transition: all 0.3s ease;
}

.cta-btn:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.menu-toggle {
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
	background: white;
	border-radius: 2px;
	transition: all 0.3s ease;
}

.bar.open:nth-child(1) {
	transform: rotate(45deg) translate(5px, 5px);
}

.bar.open:nth-child(2) {
	opacity: 0;
}

.bar.open:nth-child(3) {
	transform: rotate(-45deg) translate(5px, -5px);
}

@media (max-width: 768px) {
	.menu-toggle {
		display: flex;
	}

	nav {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: rgba(15, 23, 42, 0.98);
		flex-direction: column;
		padding: 1.5rem;
		gap: 1rem;
		transform: translateY(-10px);
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
	}

	nav.open {
		transform: translateY(0);
		opacity: 1;
		visibility: visible;
	}

	.cta-btn {
		display: none;
	}
}
</style>
