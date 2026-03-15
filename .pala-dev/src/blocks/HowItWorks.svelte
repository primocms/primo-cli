<section class="how-it-works">
	<div class="section-label">{label || 'How it works'}</div>
	<div class="section-title">{title || 'Describe it. Deploy it. Keep going.'}</div>
	<p class="section-desc">{description || 'Tell an AI agent what you want. Hand it off to your team. Come back anytime and change anything.'}</p>

	<div class="flow-steps">
		{#if steps && steps?.length > 0}
			{#each (steps || []) as step, i}
				{#if step}
					<div class="flow-step">
						<div class="flow-step-content">
							<div class="flow-step-number">{step?.number || String(i + 1).padStart(2, '0')}</div>
							<h3 class="flow-step-title">{step?.title || ''}</h3>
							<p class="flow-step-desc">{step?.description || ''}</p>
						</div>
					</div>
				{/if}
			{/each}
		{:else}
			<div class="flow-step">
				<div class="flow-step-content">
					<div class="flow-step-number">01</div>
					<h3 class="flow-step-title">Describe what you want</h3>
					<p class="flow-step-desc">Tell Claude Code, Cursor, or any AI agent to build you a site with Pala.</p>
				</div>
			</div>
			<div class="flow-step">
				<div class="flow-step-content">
					<div class="flow-step-number">02</div>
					<h3 class="flow-step-title">Your team manages it visually</h3>
					<p class="flow-step-desc">Hand off the site to your client or team. They edit visually, you keep code control.</p>
				</div>
			</div>
			<div class="flow-step">
				<div class="flow-step-content">
					<div class="flow-step-number">03</div>
					<h3 class="flow-step-title">Come back and change anything</h3>
					<p class="flow-step-desc">Pull the site down, tell your AI agent what to add, push it back.</p>
				</div>
			</div>
		{/if}
	</div>
</section>

<script>
	let { label = '', number = '', title = '', description = '', steps = [] } = $props()
</script>

<style>
.how-it-works {
		padding: 80px 24px;
		max-width: 1000px;
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
		letter-spacing: -0.02em;
	}

	.section-desc {
		color: var(--text-secondary);
		text-align: center;
		max-width: 600px;
		margin: 0 auto 48px;
		font-size: 1.1rem;
	}

	.flow-steps {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	.flow-step {
		display: grid;
		grid-template-columns: 1fr;
		gap: 32px;
		align-items: start;
	}

	.flow-step-content {
		padding: 24px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.flow-step-number {
		font-family: var(--font-mono);
		font-size: 0.9rem;
		color: var(--accent);
		margin-bottom: 12px;
	}

	.flow-step-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 8px;
	}

	.flow-step-desc {
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.6;
	}
</style>
