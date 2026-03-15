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

<header class:sticky class:in-editor={is_editor}>
	<div class="header-container">
		<a href="/" class="logo">
			{#if $site?.logo?.type === 'image' && $site?.logo?.image?.url}
				<img src={$site.logo.image.url} alt={$site?.site_name || 'Logo'} />
			{:else}
				<span class="logo-text">{$site?.logo?.text || $site?.site_name || 'Blog'}</span>
			{/if}
		</a>

		<nav class:open={is_open}>
			{#if $site?.nav_links?.length}
				<ul>
					{#each $site.nav_links as item}
						{#if item.link?.url}
							<li>
								<a href={item.link.url}>{item.link.label}</a>
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
		</nav>

		<div class="header-actions">
			{#if $site?.social_links?.length}
				<div class="social-links">
					{#each $site.social_links.slice(0, 3) as social}
						<a href={social.url} class="social-link" target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
							{#if social.platform === 'twitter'}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
							{:else if social.platform === 'linkedin'}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
							{:else if social.platform === 'github'}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
							{:else if social.platform === 'email'}
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
							{/if}
						</a>
					{/each}
				</div>
			{/if}

			<button class="menu-toggle" onclick={toggle_menu} aria-label="Toggle menu">
				{#if is_open}
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
				{/if}
			</button>
		</div>
	</div>
</header>

<style>
header {
	background: var(--theme-background, #ffffff);
	border-bottom: 1px solid var(--theme-border-color, #e2e8f0);
	padding: 1rem 0;
	z-index: 100;
}

header.sticky {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
}

header.in-editor {
	position: relative;
}

.header-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 2rem;
}

.logo {
	text-decoration: none;
	flex-shrink: 0;
}

.logo img {
	height: 36px;
	width: auto;
}

.logo-text {
	font-family: var(--theme-heading-font, 'Georgia', serif);
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--theme-text, #1a1a2e);
}

nav ul {
	display: flex;
	gap: 2rem;
	list-style: none;
	margin: 0;
	padding: 0;
}

nav a {
	color: var(--theme-text-muted, #64748b);
	text-decoration: none;
	font-weight: 500;
	font-size: 0.9375rem;
	transition: color 0.2s ease;
}

nav a:hover {
	color: var(--theme-text, #1a1a2e);
}

.header-actions {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.social-links {
	display: flex;
	gap: 0.5rem;
}

.social-link {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	color: var(--theme-text-muted, #64748b);
	border-radius: 6px;
	transition: all 0.2s ease;
}

.social-link:hover {
	color: var(--theme-primary, #6366f1);
	background: var(--theme-background-secondary, #f1f5f9);
}

.menu-toggle {
	display: none;
	background: none;
	border: none;
	padding: 0.5rem;
	cursor: pointer;
	color: var(--theme-text, #1a1a2e);
}

@media (max-width: 768px) {
	.menu-toggle {
		display: flex;
	}

	.social-links {
		display: none;
	}

	nav {
		position: fixed;
		top: 65px;
		left: 0;
		right: 0;
		background: var(--theme-background, #ffffff);
		border-bottom: 1px solid var(--theme-border-color, #e2e8f0);
		padding: 1rem 1.5rem;
		transform: translateY(-100%);
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
	}

	nav.open {
		transform: translateY(0);
		opacity: 1;
		visibility: visible;
	}

	nav ul {
		flex-direction: column;
		gap: 0;
	}

	nav li {
		border-bottom: 1px solid var(--theme-border-color, #e2e8f0);
	}

	nav li:last-child {
		border-bottom: none;
	}

	nav a {
		display: block;
		padding: 1rem 0;
	}
}
</style>
