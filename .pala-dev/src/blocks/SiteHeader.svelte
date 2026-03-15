<header class="site-header" class:in-editor={is_editor}>
	<div class="header-inner">
		<a href="/" class="logo">
			{#if logo_icon}
				<span class="logo-icon">{@html logo_icon}</span>
			{/if}
			<span class="logo-text">{site_name || 'Primo'}</span>
		</a>

		<nav class="nav">
			{#if nav_links && nav_links?.length > 0}
				{#each (nav_links || []) as link}
					<a href={link?.url} class="nav-link">{link?.label}</a>
				{/each}
			{:else}
				<a href="#how-it-works" class="nav-link">How it works</a>
				<a href="https://docs.palacms.com" class="nav-link">Docs</a>
				<a href="https://github.com/palacms/palacms" class="nav-link">GitHub</a>
			{/if}
		</nav>

		<div class="header-cta">
			<a href={github_url || 'https://github?.com/palacms/palacms'} class="github-badge">
				<span class="star-count">{github_stars || '2315'}</span>
				<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
			</a>
			<a href={cta_url || 'https://docs?.palacms?.com/getting-started'} class="btn-cta">{cta_label || 'Get Started'}</a>
		</div>
	</div>
</header>

<script>
	let { site_name = '', logo_icon = '', nav_links = [], label = '', url = undefined, github_stars = '', github_url = undefined, cta_label = '', cta_url = undefined } = $props()

	let is_editor = $state(false)
	
	$effect(() => {
		if (typeof window !== 'undefined') {
			is_editor = window.__PALA_CONTEXT__?.environment === 'editor'
		}
	})
</script>

<style>
.site-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		padding: 16px 24px;
		background: rgba(11, 11, 15, 0.8);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid var(--border, #2A2A35);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.site-header.in-editor {
		position: relative;
	}

	.header-inner {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 32px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: var(--text-primary, #E8E8EC);
	}

	.logo-icon :global(svg) {
		width: 28px;
		height: 28px;
		color: var(--accent, #4ADE80);
	}

	.logo-text {
		font-weight: 600;
		font-size: 1.25rem;
		letter-spacing: -0.02em;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 32px;
	}

	.nav-link {
		color: var(--text-secondary, #8B8B9E);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		transition: color 0.2s;
	}

	.nav-link:hover {
		color: var(--text-primary, #E8E8EC);
	}

	.header-cta {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.github-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: var(--bg-elevated, #1a1a22);
		border: 1px solid var(--border, #2A2A35);
		border-radius: 8px;
		color: var(--text-primary, #E8E8EC);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
	}

	.github-badge:hover {
		border-color: var(--border-hover, #3a3a45);
		background: var(--bg-card, #222228);
	}

	.github-badge svg {
		width: 16px;
		height: 16px;
	}

	.star-count {
		font-variant-numeric: tabular-nums;
	}

	.btn-cta {
		background: var(--accent, #C4F04E);
		color: var(--bg, #0B0B0F);
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none;
		transition: all 0.2s;
	}

	.btn-cta:hover {
		background: var(--accent-dim, #b5e045);
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		.nav {
			display: none;
		}

		.header-inner {
			gap: 16px;
		}
	}
</style>
