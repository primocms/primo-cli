<section class="cta">
	<div class="cta-title">{title || 'Start building.'}</div>
	<p class="cta-desc">{description || 'Self-hosted. Open source. Free.'}</p>

	<button class="install-cmd" onclick={copy_cmd} title="Click to copy">
		<span class="prompt-char">$</span>
		<span>{command || 'docker run -d -p 8080:8080 ghcr?.io/palacms/palacms:latest'}</span>
		<span class="copy-hint">click to copy</span>
	</button>

	<div class="cta-links">
		{#if links && links?.length > 0}
			{#each (links || []) as item}
				{#if item && item?.link}
					<a href="{item?.link?.url || '#'}">{item?.link?.label || 'Link'}</a>
				{/if}
			{/each}
		{:else}
			<a href="https://docs.palacms.com">Read the docs</a>
			<a href="https://github.com/palacms/palacms">View on GitHub</a>
			<a href="https://docs.palacms.com/getting-started/installation">Deploy on Railway</a>
		{/if}
	</div>
</section>

<script>
	let { title = '', link = {}, description = '', command = '', links = [] } = $props()

	function copy_cmd() {
			const cmd = command || 'docker run -d -p 8080:8080 ghcr.io/palacms/palacms:latest'
			if (typeof navigator !== 'undefined' && navigator.clipboard) {
				navigator.clipboard.writeText(cmd)
			}
		}
</script>

<style>
.cta {
		padding: 80px 24px;
		max-width: 700px;
		margin: 0 auto;
		text-align: center;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.cta-title {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 600;
		margin-bottom: 16px;
	}

	.cta-desc {
		color: var(--text-secondary);
		font-size: 1.25rem;
		margin: 0 0 32px;
	}

	.install-cmd {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		color: var(--text-primary);
		padding: 16px 24px;
		border-radius: 8px;
		font-family: var(--font-mono);
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s;
		margin-bottom: 32px;
	}

	.install-cmd:hover {
		border-color: var(--accent);
	}

	.prompt-char {
		color: var(--terminal-green);
	}

	.copy-hint {
		color: var(--text-tertiary);
		font-size: 0.8rem;
		margin-left: 8px;
	}

	.cta-links {
		display: flex;
		justify-content: center;
		gap: 32px;
		flex-wrap: wrap;
	}

	.cta-links a {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 1rem;
		transition: color 0.2s;
	}

	.cta-links a:hover {
		color: var(--accent);
	}
</style>
