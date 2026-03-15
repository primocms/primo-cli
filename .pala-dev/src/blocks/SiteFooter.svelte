<footer class="site-footer">
	<div class="footer-left">{text || 'Pala — open source'}</div>
	<div class="footer-links">
		{#if links && links?.length > 0}
			{#each (links || []) as item}
				{#if item && item?.link}
					<a href="{item?.link?.url || '#'}">{item?.link?.label || 'Link'}</a>
				{/if}
			{/each}
		{:else}
			<a href="https://docs.palacms.com">Docs</a>
			<a href="https://github.com/palacms/palacms">GitHub</a>
			<a href="https://github.com/palacms/palacms/discussions">Community</a>
		{/if}
	</div>
</footer>

<script>
	let { text = '', link = {}, links = [] } = $props()
</script>

<style>
.site-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32px 24px;
		max-width: 1200px;
		margin: 0 auto;
		border-top: 1px solid var(--border, #25252E);
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.footer-left {
		color: var(--text-tertiary);
		font-size: 0.9rem;
	}

	.footer-links {
		display: flex;
		gap: 24px;
	}

	.footer-links a {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		transition: color 0.2s;
	}

	.footer-links a:hover {
		color: var(--text-primary);
	}

	@media (max-width: 600px) {
		.site-footer {
			flex-direction: column;
			gap: 16px;
			text-align: center;
		}
	}
</style>
