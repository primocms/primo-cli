<section class="problem">
	{#if text_1}
		<div class="problem-text">{@html text_1}</div>
	{:else}
		<p class="problem-text">
			Every CMS makes you choose. Visual builders give editors freedom but <strong>lock developers out of the code</strong>. Developer frameworks give you control but <strong>leave your team staring at a repo they can't use</strong>.
		</p>
	{/if}
	{#if text_2}
		<div class="problem-text">{@html text_2}</div>
	{:else}
		<p class="problem-text">
			Your site should be something your team edits visually <strong>and</strong> something on your filesystem that any tool can modify. Not one or the other. Both.
		</p>
	{/if}
</section>

<style>
.problem {
		padding: 80px 24px;
		max-width: 800px;
		margin: 0 auto;
		text-align: center;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.problem-text {
		font-size: clamp(1.25rem, 3vw, 1.5rem);
		line-height: 1.7;
		color: var(--text-secondary);
		margin: 0 0 24px;
	}

	.problem-text :global(strong) {
		color: var(--text-primary);
		font-weight: 500;
	}
</style>