<section class="bridge">
	{#if text}
		<div class="bridge-text">{@html text}</div>
	{:else}
		<p class="bridge-text">
			Everything you'd expect from a CMS — <em>visual editing, collaboration, publishing</em> — plus everything you wouldn't: <em>your entire site as local files, editable by any tool in your stack</em>.
		</p>
	{/if}
</section>

<style>
.bridge {
		padding: 80px 24px;
		max-width: 900px;
		margin: 0 auto;
		text-align: center;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.bridge-text {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		line-height: 1.6;
		color: var(--text-secondary);
		margin: 0;
	}

	.bridge-text :global(em) {
		color: var(--text-primary);
		font-style: normal;
	}
</style>