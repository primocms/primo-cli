<section class="projects" id="projects">
	<div class="container">
		<div class="header">
			{#if badge}
				<span class="badge">{badge}</span>
			{/if}
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if projects?.length}
			<div class="projects-grid">
				{#each projects as project, index}
					<article class="project-card" class:featured={index === 0}>
						{#if project.image?.url}
							<div class="project-image">
								<img src={project.image.url} alt={project.project_title} />
								<div class="project-overlay">
									<div class="project-links">
										{#if project.live_url}
											<a href={project.live_url} class="project-link" target="_blank" rel="noopener noreferrer" aria-label="View live site">
												<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
											</a>
										{/if}
										{#if project.github_url}
											<a href={project.github_url} class="project-link" target="_blank" rel="noopener noreferrer" aria-label="View source code">
												<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
											</a>
										{/if}
									</div>
								</div>
							</div>
						{/if}

						<div class="project-content">
							<h3>{project.project_title}</h3>
							<p>{project.description}</p>

							{#if project.tags}
								<div class="project-tags">
									{#each project.tags.split(',') as tag}
										<span class="tag">{tag.trim()}</span>
									{/each}
								</div>
							{/if}
						</div>
					</article>
				{/each}
			</div>
		{/if}

		{#if view_all_cta?.url}
			<div class="cta-wrapper">
				<a href={view_all_cta.url} class="view-all-btn">
					{view_all_cta.label}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
				</a>
			</div>
		{/if}
	</div>
</section>

<style>
.projects {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background, #ffffff);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.header {
	text-align: center;
	max-width: 700px;
	margin: 0 auto 4rem;
}

.badge {
	display: inline-block;
	background: rgba(99, 102, 241, 0.1);
	color: var(--theme-primary, #6366f1);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
}

h2 {
	font-size: clamp(2rem, 4vw, 2.75rem);
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0;
}

.projects-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 2rem;
}

.project-card {
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	overflow: hidden;
	transition: all 0.3s ease;
}

.project-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.project-card.featured {
	grid-column: span 2;
}

.project-image {
	position: relative;
	overflow: hidden;
	aspect-ratio: 16 / 9;
}

.featured .project-image {
	aspect-ratio: 21 / 9;
}

.project-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.5s ease;
}

.project-card:hover .project-image img {
	transform: scale(1.05);
}

.project-overlay {
	position: absolute;
	inset: 0;
	background: rgba(15, 23, 42, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.3s ease;
}

.project-card:hover .project-overlay {
	opacity: 1;
}

.project-links {
	display: flex;
	gap: 1rem;
}

.project-link {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	background: white;
	border-radius: 12px;
	color: #0f172a;
	transition: all 0.2s ease;
}

.project-link:hover {
	background: var(--theme-primary, #6366f1);
	color: white;
	transform: scale(1.1);
}

.project-content {
	padding: 1.5rem;
}

h3 {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.75rem;
}

.project-content p {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.6;
	margin: 0 0 1rem;
}

.project-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.tag {
	background: var(--theme-background, #ffffff);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	padding: 0.25rem 0.75rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	color: var(--theme-text-muted, #64748b);
}

.cta-wrapper {
	text-align: center;
	margin-top: 3rem;
}

.view-all-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: transparent;
	color: var(--theme-primary, #6366f1);
	padding: 1rem 2rem;
	border-radius: 12px;
	font-weight: 600;
	text-decoration: none;
	border: 2px solid var(--theme-primary, #6366f1);
	transition: all 0.3s ease;
}

.view-all-btn:hover {
	background: var(--theme-primary, #6366f1);
	color: white;
}

.view-all-btn svg {
	transition: transform 0.3s ease;
}

.view-all-btn:hover svg {
	transform: translateX(4px);
}

@media (max-width: 768px) {
	.projects-grid {
		grid-template-columns: 1fr;
	}

	.project-card.featured {
		grid-column: span 1;
	}

	.featured .project-image {
		aspect-ratio: 16 / 9;
	}
}
</style>
