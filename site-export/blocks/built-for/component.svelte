<section class="built-for">
	{#if text}
		<p class="built-for-text">{@html text}</p>
	{:else}
		<p class="built-for-text">
			Built for <em>developers who build sites for other people</em> — freelancers, agencies, and small teams who want full code control without leaving their clients stranded.
		</p>
	{/if}
</section>

<style>
.built-for {
		padding: 60px 24px;
		max-width: 900px;
		margin: 0 auto;
		text-align: center;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.built-for-text {
		font-size: clamp(1.1rem, 2.5vw, 1.35rem);
		line-height: 1.7;
		color: var(--text-secondary);
		margin: 0;
	}

	.built-for-text :global(em) {
		color: var(--text-primary);
		font-style: italic;
	}
</style>