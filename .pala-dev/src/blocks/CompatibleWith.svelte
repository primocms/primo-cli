<section class="compatible-with">
	<div class="section-label">{label || 'Compatible with'}</div>
	<div class="section-title">{title || 'Any agent that can edit files can edit your site.'}</div>

	<div class="logos">
		{#each items || [] as item}
			<div class="logo-item">
				<div class="logo-icon">{item?.icon || '⌘'}</div>
				<span class="logo-name">{item?.name || 'Tool'}</span>
			</div>
		{/each}
	</div>

	{#if tagline}
		<div class="tagline">{@html tagline}</div>
	{:else}
		<p class="tagline">No integrations. No plugins. You run <code>npx pala pull</code>, your site becomes files, and every tool in your stack just works.</p>
	{/if}
</section>

<script>
	let { label = '', icon = '', title = '', name = '', tagline = undefined, items = [] } = $props()
</script>

<style>
.compatible-with {
		padding: 80px 24px;
		max-width: 900px;
		margin: 0 auto;
		text-align: center;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.section-label {
		text-transform: uppercase;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--accent);
		margin-bottom: 16px;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 600;
		margin-bottom: 48px;
		max-width: 500px;
		margin-left: auto;
		margin-right: auto;
	}

	.logos {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 32px;
		margin-bottom: 48px;
	}

	.logo-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.logo-icon {
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 16px;
		font-size: 1.5rem;
		transition: all 0.2s;
	}

	.logo-item:hover .logo-icon {
		border-color: var(--accent);
		transform: translateY(-2px);
	}

	.logo-name {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	.tagline {
		color: var(--text-secondary);
		font-size: 1.1rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.tagline :global(code) {
		font-family: var(--font-mono);
		background: var(--bg-elevated);
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 0.95em;
	}
</style>
