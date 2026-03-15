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
				<span class="logo-text">MetricFlow</span>
			{/if}
		</a>

		<nav class:open={mobile_open}>
			{#if nav_links?.length}
				{#each nav_links as item}
					<a href={item.link?.url} class="nav-link">{item.link?.label}</a>
				{/each}
			{/if}
		</nav>

		<div class="header-actions">
			<a href="/login" class="login-link">Log in</a>
			{#if header_cta?.url}
				<a href={header_cta.url} class="nav-cta">{header_cta.label}</a>
			{/if}
		</div>

		<button class="mobile-toggle" onclick={toggle_mobile} aria-label="Toggle menu">
			{#if mobile_open}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
			{/if}
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
	background: transparent;
}

header.scrolled {
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(12px);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	padding: 0.75rem 0;
}

.header-container {
	max-width: 1280px;
	margin: 0 auto;
	padding: 0 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 2rem;
}

.logo {
	display: flex;
	align-items: center;
	text-decoration: none;
	flex-shrink: 0;
}

.logo img {
	height: 32px;
	width: auto;
}

.logo-text {
	font-size: 1.5rem;
	font-weight: 700;
	background: linear-gradient(135deg, var(--theme-primary, #0ea5e9) 0%, #6366f1 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

nav {
	display: flex;
	align-items: center;
	gap: 2rem;
	flex: 1;
	justify-content: center;
}

.nav-link {
	color: var(--theme-text, #1e293b);
	text-decoration: none;
	font-weight: 500;
	font-size: 0.9375rem;
	transition: color 0.2s ease;
	position: relative;
}

header:not(.scrolled) .nav-link {
	color: #1e293b;
}

.nav-link::after {
	content: '';
	position: absolute;
	bottom: -4px;
	left: 0;
	width: 0;
	height: 2px;
	background: var(--theme-primary, #0ea5e9);
	transition: width 0.2s ease;
}

.nav-link:hover::after {
	width: 100%;
}

.nav-link:hover {
	color: var(--theme-primary, #0ea5e9);
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-shrink: 0;
}

.login-link {
	color: var(--theme-text, #1e293b);
	text-decoration: none;
	font-weight: 500;
	font-size: 0.9375rem;
	transition: color 0.2s ease;
}

.login-link:hover {
	color: var(--theme-primary, #0ea5e9);
}

.nav-cta {
	background: var(--theme-primary, #0ea5e9);
	color: white;
	padding: 0.625rem 1.25rem;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	font-size: 0.9375rem;
	transition: all 0.2s ease;
}

.nav-cta:hover {
	background: var(--theme-primary-dark, #0284c7);
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.mobile-toggle {
	display: none;
	background: none;
	border: none;
	cursor: pointer;
	padding: 0.5rem;
	color: var(--theme-text, #1e293b);
}

@media (max-width: 768px) {
	.mobile-toggle {
		display: flex;
	}

	.header-actions .login-link {
		display: none;
	}

	nav {
		position: fixed;
		top: 60px;
		left: 0;
		right: 0;
		background: white;
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
		color: var(--theme-text, #1e293b);
		padding: 0.5rem 0;
	}
}
</style>
