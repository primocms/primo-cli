<section class="features">
	<div class="section-label">{label || "Everything you'd expect"}</div>
	<div class="section-title">{title || "And everything you wouldn't."}</div>
	<p class="section-desc">{description || 'Visual editing, collaboration, static generation — plus your entire site as local files.'}</p>

	<div class="features-grid">
		{#if items && items.length > 0}
			{#each items as item}
				{#if item}
					<div class="feature-card">
						<div class="feature-icon">{item.icon || ''}</div>
						<div class="feature-title">{item.title || ''}</div>
						<div class="feature-desc">{item.description || ''}</div>
					</div>
				{/if}
			{/each}
		{:else}
			<div class="feature-card">
				<div class="feature-icon">◧</div>
				<div class="feature-title">Visual page building</div>
				<div class="feature-desc">Editors drag blocks onto pages, edit content inline, and publish.</div>
			</div>
			<div class="feature-card">
				<div class="feature-icon">⟨⟩</div>
				<div class="feature-title">Code-first components</div>
				<div class="feature-desc">Build reusable blocks with Svelte in a browser-based IDE.</div>
			</div>
			<div class="feature-card">
				<div class="feature-icon">⚡</div>
				<div class="feature-title">Static generation</div>
				<div class="feature-desc">Every site compiles to static HTML. Fast, secure, SEO-optimized.</div>
			</div>
			<div class="feature-card">
				<div class="feature-icon">⇄</div>
				<div class="feature-title">Local dev sync</div>
				<div class="feature-desc">Pull your site as files. Edit with any IDE. Push changes back.</div>
			</div>
			<div class="feature-card">
				<div class="feature-icon">👥</div>
				<div class="feature-title">Collaboration</div>
				<div class="feature-desc">Invite clients and teammates with role-based access.</div>
			</div>
			<div class="feature-card">
				<div class="feature-icon">∞</div>
				<div class="feature-title">Unlimited sites</div>
				<div class="feature-desc">One self-hosted server powers all your client sites.</div>
			</div>
		{/if}
	</div>
</section>

<style>
.features {
		padding: 80px 24px;
		max-width: 1100px;
		margin: 0 auto;
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
		text-align: center;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 600;
		text-align: center;
		margin-bottom: 16px;
	}

	.section-desc {
		color: var(--text-secondary);
		text-align: center;
		max-width: 600px;
		margin: 0 auto 48px;
		font-size: 1.1rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 24px;
	}

	.feature-card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 24px;
		transition: all 0.2s;
	}

	.feature-card:hover {
		border-color: var(--border-hover);
		transform: translateY(-2px);
	}

	.feature-icon {
		font-size: 1.5rem;
		margin-bottom: 16px;
	}

	.feature-title {
		font-weight: 600;
		margin-bottom: 8px;
		font-size: 1.1rem;
	}

	.feature-desc {
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.5;
	}
</style>