<script>
const tools = ['Claude Code', 'Cursor', 'Codex', 'Gemini CLI', 'Windsurf', 'your IDE']
	let tool_index = $state(0)

	$effect(() => {
		const interval = setInterval(() => {
			tool_index = (tool_index + 1) % tools.length
		}, 2200)
		return () => clearInterval(interval)
	})
</script>

<section class="hero">
	<div class="hero-top">
		<h1 class="hero-headline">
			{headline || 'Build sites with'} <em>{headline_highlight || 'your AI agent.'}</em><br>{headline_suffix || 'Manage them visually.'}
		</h1>
		<p class="hero-sub">{subheadline || 'Pala represents your entire site as files. Pull it down, edit with Claude Code, Cursor, or any agent, push it back. Your team manages content visually in the browser.'}</p>
		<div class="tool-cycle">
			<span class="tool-cycle-label">Works with</span>
			<span class="tool-cycle-name">{tools[tool_index]}</span>
		</div>
		<div class="hero-actions">
			<a href="{(cta_primary && cta_primary.url) || '#'}" class="btn-primary">{(cta_primary && cta_primary.label) || 'Get Started'}</a>
			<a href="{(cta_secondary && cta_secondary.url) || '#how-it-works'}" class="btn-secondary">{(cta_secondary && cta_secondary.label) || 'See how it works'}</a>
		</div>
		<div class="hero-badges">
			<a href="{github_url || 'https://github.com/palacms/palacms'}" class="github-badge">
				<span class="star">★</span>
				<span>{github_stars || '2,300+ GitHub stars'}</span>
			</a>
			<span class="badge-sep">·</span>
			<span class="badge">Open source</span>
			<span class="badge-sep">·</span>
			<span class="badge">Self-hosted</span>
		</div>
	</div>

	<div class="hero-panels">
		<div class="hero-panel">
			<div class="terminal-bar">
				<div class="terminal-dot"></div>
				<div class="terminal-dot"></div>
				<div class="terminal-dot"></div>
				<span class="terminal-title">CLAUDE CODE</span>
			</div>
			<div class="terminal-content">
				<div class="agent-lines">
					<div class="prompt-line"><span class="prompt">▸</span> Build me a coffee shop website with Pala.</div>
					<div class="prompt-desc">A hero with the shop's story, a full menu</div>
					<div class="prompt-desc">with prices, about page, and a blog.</div>
					<div class="prompt-desc">Warm minimal design, dark background.</div>
					<div class="file-list">
						<div><span class="creating">Creating</span> <span class="file">blocks/hero/component.svelte</span></div>
						<div><span class="creating">Creating</span> <span class="file">blocks/menu/component.svelte</span></div>
						<div><span class="creating">Creating</span> <span class="file">blocks/about/component.svelte</span></div>
						<div><span class="creating">Creating</span> <span class="file">blocks/blog-post/component.svelte</span></div>
						<div><span class="creating">Creating</span> <span class="file">pages/index.json</span></div>
						<div><span class="creating">Creating</span> <span class="file">pages/about.json</span></div>
						<div><span class="creating">Creating</span> <span class="file">pages/blog/_type.json</span></div>
						<div class="cmd-line">$ npx pala push</div>
						<div class="success">✓ Site is live at nicecoffeeshop.com</div>
					</div>
				</div>
			</div>
		</div>

		<div class="hero-panel editor-panel">
			<div class="editor-bar">
				<div class="editor-dot"></div>
				<div class="editor-dot"></div>
				<div class="editor-dot"></div>
				<span class="editor-title">VISUAL EDITOR</span>
			</div>
			<div class="editor-content">
				<div class="editor-mock-block active">
					<span class="block-label">Hero</span>
					<div class="drag-handle"><span></span><span></span><span></span></div>
					<div class="editor-mock-image"></div>
					<div class="editor-mock-text long"></div>
					<div class="editor-mock-text short"></div>
				</div>
				<div class="editor-mock-block">
					<span class="block-label">Menu</span>
					<div class="drag-handle"><span></span><span></span><span></span></div>
					<div style="display:flex;gap:8px;">
						<div style="flex:1;height:36px;background:var(--border);border-radius:4px;"></div>
						<div style="flex:1;height:36px;background:var(--border);border-radius:4px;"></div>
						<div style="flex:1;height:36px;background:var(--border);border-radius:4px;"></div>
					</div>
				</div>
				<div class="editor-mock-block">
					<span class="block-label">About</span>
					<div class="drag-handle"><span></span><span></span><span></span></div>
					<div style="display:flex;flex-direction:column;gap:4px;">
						<div class="editor-mock-text long"></div>
						<div class="editor-mock-text"></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
.hero {
		padding: 100px 24px 60px;
		max-width: 1200px;
		margin: 0 auto;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.hero :global(*) {
		box-sizing: border-box;
	}

	.hero-top {
		text-align: center;
		margin-bottom: 48px;
	}

	.hero-headline {
		font-family: var(--font-display);
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 600;
		line-height: 1.15;
		margin: 0 0 24px;
		letter-spacing: -0.03em;
	}

	.hero-headline em {
		color: var(--accent);
		font-style: normal;
	}

	.hero-sub {
		font-size: 1.2rem;
		color: var(--text-secondary);
		max-width: 620px;
		margin: 0 auto 28px;
		line-height: 1.6;
	}

	.tool-cycle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		margin-bottom: 28px;
	}

	.tool-cycle-label {
		color: var(--text-tertiary);
	}

	.tool-cycle-name {
		color: var(--accent);
		font-weight: 500;
	}

	.hero-actions {
		display: flex;
		gap: 16px;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 24px;
	}

	.btn-primary {
		background: var(--accent);
		color: var(--bg);
		padding: 14px 32px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
		transition: all 0.2s;
		text-decoration: none;
	}

	.btn-primary:hover {
		background: var(--accent-dim);
		transform: translateY(-1px);
	}

	.btn-secondary {
		background: transparent;
		color: var(--text-primary);
		padding: 14px 32px;
		border-radius: 8px;
		font-weight: 500;
		font-size: 1rem;
		border: 1px solid var(--border);
		transition: all 0.2s;
		text-decoration: none;
	}

	.btn-secondary:hover {
		border-color: var(--border-hover);
		background: var(--bg-elevated);
	}

	.hero-badges {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		color: var(--text-tertiary);
		font-size: 0.9rem;
	}

	.github-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.2s;
	}

	.github-badge:hover {
		color: var(--text-primary);
	}

	.github-badge .star {
		color: #f0c14b;
	}

	.badge-sep {
		color: var(--text-tertiary);
	}

	.badge {
		color: var(--text-tertiary);
	}

	.hero-panels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}

	@media (max-width: 900px) {
		.hero-panels {
			grid-template-columns: 1fr;
		}
	}

	.hero-panel {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.terminal-bar, .editor-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: var(--bg-card);
		border-bottom: 1px solid var(--border);
	}

	.terminal-dot, .editor-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--border);
	}

	.terminal-title, .editor-title {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-tertiary);
		letter-spacing: 0.05em;
	}

	.terminal-content {
		padding: 20px;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		line-height: 1.6;
		min-height: 280px;
	}

	.prompt-line {
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.prompt {
		color: var(--terminal-blue);
	}

	.prompt-desc {
		color: var(--text-tertiary);
		padding-left: 16px;
	}

	.file-list {
		margin-top: 16px;
	}

	.creating {
		color: var(--terminal-green);
	}

	.file {
		color: var(--terminal-blue);
	}

	.cmd-line {
		margin-top: 12px;
		color: var(--text-primary);
	}

	.success {
		color: var(--terminal-green);
	}

	.editor-content {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 280px;
	}

	.editor-mock-block {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 12px;
		position: relative;
		transition: all 0.2s;
	}

	.editor-mock-block.active {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent);
	}

	.block-label {
		position: absolute;
		top: -8px;
		left: 12px;
		background: var(--bg-card);
		padding: 0 6px;
		font-size: 0.7rem;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.editor-mock-block.active .block-label {
		color: var(--accent);
	}

	.drag-handle {
		position: absolute;
		top: 12px;
		right: 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		opacity: 0.4;
	}

	.drag-handle span {
		width: 12px;
		height: 2px;
		background: var(--text-tertiary);
		border-radius: 1px;
	}

	.editor-mock-image {
		height: 50px;
		background: linear-gradient(135deg, var(--border) 0%, var(--bg) 100%);
		border-radius: 4px;
		margin-bottom: 8px;
		margin-top: 8px;
	}

	.editor-mock-text {
		height: 8px;
		background: var(--border);
		border-radius: 4px;
		margin-bottom: 6px;
		width: 70%;
	}

	.editor-mock-text.long { width: 90%; }
	.editor-mock-text.short { width: 50%; }
</style>