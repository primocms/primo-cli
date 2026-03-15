<section class="features">
	<div class="section-header">
		<div class="section-label">{label || "Everything you'd expect"}</div>
		<h2 class="section-title">{title || "And everything you wouldn't."}</h2>
		<p class="section-desc">{description || 'Visual editing, collaboration, static generation — plus your entire site as local files.'}</p>
	</div>

	<div class="bento-grid">
		{#if items && items.length > 0}
			{#each items as item, i}
				{#if item}
					<div class="bento-card bento-card-{i}">
						<div class="card-header">
							<div class="card-icon">{@html item.icon || ''}</div>
							<h3 class="card-title">{item.title || ''}</h3>
						</div>
						<p class="card-desc">{item.description || ''}</p>
						<div class="card-visual card-visual-{i}">
							{#if i === 0}
								<!-- Visual Editor mockup -->
								<div class="visual-editor">
									<div class="editor-toolbar">
										<span class="dot"></span>
										<span class="dot"></span>
										<span class="dot"></span>
									</div>
									<div class="editor-content">
										<div class="editor-block"></div>
										<div class="editor-block active"></div>
										<div class="editor-block"></div>
									</div>
								</div>
							{:else if i === 1}
								<!-- File tree -->
								<div class="file-tree">
									<div class="file-item"><span class="folder">blocks/</span></div>
									<div class="file-item indent"><span class="file">hero.svelte</span></div>
									<div class="file-item indent"><span class="file">features.svelte</span></div>
									<div class="file-item"><span class="folder">pages/</span></div>
									<div class="file-item indent"><span class="file">index.yaml</span></div>
								</div>
							{:else if i === 2}
								<!-- Performance graph -->
								<div class="perf-graph">
									<svg viewBox="0 0 100 40" preserveAspectRatio="none">
										<path d="M0,35 Q25,30 40,20 T70,15 T100,5" stroke="currentColor" stroke-width="2" fill="none"/>
									</svg>
									<div class="perf-label">99ms</div>
								</div>
							{:else if i === 3}
								<!-- CSS variables -->
								<div class="css-vars">
									<code>--primary: <span class="color-dot"></span></code>
									<code>--font: Inter</code>
									<code>--radius: 8px</code>
								</div>
							{:else if i === 4}
								<!-- Avatars -->
								<div class="team-avatars">
									<div class="avatar">A</div>
									<div class="avatar">B</div>
									<div class="avatar">C</div>
									<div class="avatar more">+2</div>
								</div>
							{:else if i === 5}
								<!-- Server icon -->
								<div class="server-stack">
									<div class="server-unit"></div>
									<div class="server-unit active"></div>
									<div class="server-unit"></div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		{/if}
	</div>
</section>

<style>
.features {
		padding: 100px 24px;
		max-width: 1400px;
		margin: 0 auto;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.section-header {
		text-align: center;
		margin-bottom: 64px;
	}

	.section-label {
		text-transform: uppercase;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--accent, #818cf8);
		margin-bottom: 16px;
	}

	.section-title {
		font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 700;
		margin: 0 0 16px;
		line-height: 1.2;
	}

	.section-desc {
		color: var(--text-secondary, #9ca3af);
		max-width: 600px;
		margin: 0 auto;
		font-size: 1.125rem;
		line-height: 1.6;
	}

	.bento-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(2, minmax(280px, auto));
		gap: 16px;
	}

	.bento-card {
		background: var(--bg-elevated, #131318);
		border: 1px solid var(--border, #1f1f28);
		border-radius: 24px;
		padding: 28px;
		display: flex;
		flex-direction: column;
		transition: all 0.3s ease;
		overflow: hidden;
		position: relative;
	}

	.bento-card:hover {
		border-color: var(--border-hover, #2a2a38);
		transform: translateY(-2px);
	}

	/* Card 0: Visual Editing - Large left card */
	.bento-card-0 {
		grid-column: span 2;
		grid-row: span 2;
	}

	/* Card 1: Files on Disk - Tall right */
	.bento-card-1 {
		grid-column: span 1;
		grid-row: span 2;
	}

	/* Card 2: Static Generation - Top right */
	.bento-card-2 {
		grid-column: span 1;
		grid-row: span 1;
	}

	/* Card 3: Theme Variables - Bottom middle-left */
	.bento-card-3 {
		grid-column: span 1;
		grid-row: span 1;
	}

	/* Card 4: Team Collaboration - Bottom middle */
	.bento-card-4 {
		grid-column: span 1;
		grid-row: span 1;
	}

	/* Card 5: Self-Hosted - Bottom right */
	.bento-card-5 {
		grid-column: span 1;
		grid-row: span 1;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.card-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent, #818cf8);
		flex-shrink: 0;
	}

	.card-icon :global(svg) {
		width: 24px;
		height: 24px;
	}

	.card-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary, #E8E8EC);
	}

	.card-desc {
		color: var(--text-secondary, #9ca3af);
		font-size: 0.95rem;
		line-height: 1.5;
		margin: 0 0 auto;
	}

	.card-visual {
		margin-top: 24px;
		flex: 1;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	/* Visual Editor mockup */
	.visual-editor {
		width: 100%;
		max-width: 400px;
		background: #0a0a0f;
		border-radius: 12px;
		border: 1px solid #1f1f28;
		overflow: hidden;
	}

	.editor-toolbar {
		padding: 12px;
		display: flex;
		gap: 6px;
		border-bottom: 1px solid #1f1f28;
	}

	.editor-toolbar .dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #2a2a38;
	}

	.editor-content {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.editor-block {
		height: 40px;
		background: #1a1a22;
		border-radius: 8px;
		border: 1px solid transparent;
	}

	.editor-block.active {
		border-color: var(--accent, #818cf8);
		box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.15);
	}

	/* File tree */
	.file-tree {
		width: 100%;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.85rem;
	}

	.file-item {
		padding: 8px 0;
		color: var(--text-secondary, #9ca3af);
	}

	.file-item.indent {
		padding-left: 20px;
	}

	.folder {
		color: var(--accent, #818cf8);
	}

	.file {
		color: var(--text-primary, #E8E8EC);
	}

	/* Performance graph */
	.perf-graph {
		width: 100%;
		position: relative;
	}

	.perf-graph svg {
		width: 100%;
		height: 60px;
		color: var(--accent, #818cf8);
	}

	.perf-label {
		position: absolute;
		top: 0;
		right: 0;
		background: var(--accent, #818cf8);
		color: #000;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	/* CSS variables */
	.css-vars {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 0.8rem;
		color: var(--text-secondary, #9ca3af);
	}

	.css-vars code {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.color-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--accent, #818cf8);
	}

	/* Team avatars */
	.team-avatars {
		display: flex;
		gap: -8px;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.875rem;
		border: 2px solid var(--bg-elevated, #131318);
		margin-left: -8px;
	}

	.avatar:first-child {
		margin-left: 0;
	}

	.avatar.more {
		background: #1f1f28;
		color: var(--text-secondary, #9ca3af);
	}

	/* Server stack */
	.server-stack {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		max-width: 200px;
	}

	.server-unit {
		height: 24px;
		background: #1a1a22;
		border-radius: 4px;
		border: 1px solid #2a2a38;
		position: relative;
	}

	.server-unit::before {
		content: '';
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #2a2a38;
	}

	.server-unit.active::before {
		background: #22c55e;
		box-shadow: 0 0 8px #22c55e;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.bento-grid {
			grid-template-columns: repeat(2, 1fr);
			grid-template-rows: auto;
		}

		.bento-card-0 {
			grid-column: span 2;
			grid-row: span 1;
		}

		.bento-card-1 {
			grid-column: span 1;
			grid-row: span 1;
		}

		.bento-card-2,
		.bento-card-3,
		.bento-card-4,
		.bento-card-5 {
			grid-column: span 1;
			grid-row: span 1;
		}
	}

	@media (max-width: 640px) {
		.features {
			padding: 64px 16px;
		}

		.bento-grid {
			grid-template-columns: 1fr;
		}

		.bento-card-0,
		.bento-card-1 {
			grid-column: span 1;
		}

		.card-visual {
			min-height: 120px;
		}
	}
</style>