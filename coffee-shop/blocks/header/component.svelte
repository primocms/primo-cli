<script>
let is_scrolled = $state(false)
let mobile_open = $state(false)

$effect(() => {
	if (typeof window !== 'undefined') {
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
</script>

<header class:scrolled={is_scrolled}>
	<div class="header-container">
		<a href="/" class="logo">
			{#if logo?.type === 'image' && logo?.image?.url}
				<img src={logo.image.url} alt={logo.image.alt || logo.text || 'Logo'} />
			{:else if logo?.text}
				<span class="logo-text">{logo.text}</span>
			{:else}
				<span class="logo-text">Ember & Brew</span>
			{/if}
		</a>

		<nav class:open={mobile_open}>
			{#if nav_links?.length}
				{#each nav_links as item}
					<a href={item.link?.url} class="nav-link">{item.link?.label}</a>
				{/each}
			{/if}
			{#if header_cta?.url}
				<a href={header_cta.url} class="nav-cta">{header_cta.label}</a>
			{/if}
		</nav>

		<button class="mobile-toggle" onclick={toggle_mobile} aria-label="Toggle menu">
			<span class="bar"></span>
			<span class="bar"></span>
			<span class="bar"></span>
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
	padding: 1rem 0;
	transition: all 0.3s ease;
}

header.scrolled {
	background: rgba(255, 250, 245, 0.95);
	backdrop-filter: blur(10px);
	box-shadow: 0 1px 3px rgba(44, 24, 16, 0.1);
	padding: 0.75rem 0;
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
	font-family: var(--theme-heading-font, 'Cormorant Garamond', Georgia, serif);
	font-size: 1.75rem;
	font-weight: 600;
	color: var(--theme-primary, #8B4513);
}

header:not(.scrolled) .logo-text {
	color: white;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

nav {
	display: flex;
	align-items: center;
	gap: 2rem;
}

.nav-link {
	color: var(--theme-text, #2C1810);
	text-decoration: none;
	font-weight: 500;
	font-size: 0.9375rem;
	transition: color 0.2s ease;
}

header:not(.scrolled) .nav-link {
	color: white;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.nav-link:hover {
	color: var(--theme-primary, #8B4513);
}

.nav-cta {
	background: var(--theme-primary, #8B4513);
	color: white;
	padding: 0.625rem 1.25rem;
	border-radius: 6px;
	text-decoration: none;
	font-weight: 600;
	font-size: 0.9375rem;
	transition: all 0.2s ease;
}

.nav-cta:hover {
	background: var(--theme-primary-dark, #654321);
	transform: translateY(-1px);
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
	background: var(--theme-text, #2C1810);
	transition: all 0.3s ease;
}

header:not(.scrolled) .bar {
	background: white;
}

@media (max-width: 768px) {
	.mobile-toggle {
		display: flex;
	}

	nav {
		position: fixed;
		top: 60px;
		left: 0;
		right: 0;
		background: var(--theme-background, #FFFAF5);
		flex-direction: column;
		padding: 1.5rem;
		gap: 1rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: translateY(-100%);
		opacity: 0;
		pointer-events: none;
		transition: all 0.3s ease;
	}

	nav.open {
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto;
	}

	nav .nav-link {
		color: var(--theme-text, #2C1810);
	}
}
</style>
