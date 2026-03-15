<script>
function get_tags(tags_string) {
	if (!tags_string) return []
	return tags_string.split(',').map(t => t.trim()).filter(Boolean)
}
</script>

<section class="projects" id="projects">
	<div class="container">
		<div class="section-header">
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
				{#each projects as project}
					<article class="project-card">
						{#if project.image?.url}
							<div class="project-image">
								<img src={project.image.url} alt={project.image.alt || project.project_title} />
							</div>
						{/if}

						<div class="project-content">
							{#if project.project_title}
								<h3>{project.project_title}</h3>
							{/if}

							{#if project.description}
								<p>{project.description}</p>
							{/if}

							{#if project.tags}
								<div class="tags">
									{#each get_tags(project.tags) as tag}
										<span class="tag">{tag}</span>
									{/each}
								</div>
							{/if}

							{#if project.link?.url}
								<a href={project.link.url} class="project-link">
									{project.link.label || 'View Project'}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
								</a>
							{/if}
						</div>
					</article>
				{/each}
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

.section-header {
	text-align: center;
	max-width: 600px;
	margin: 0 auto 4rem;
}

.badge {
	display: inline-block;
	background: rgba(15, 23, 42, 0.06);
	color: var(--theme-text, #0f172a);
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
	margin: 0;
	line-height: 1.7;
}

.projects-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 2rem;
}

.project-card {
	background: var(--theme-background-secondary, #f8fafc);
	border-radius: 16px;
	overflow: hidden;
	transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.project-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.project-image {
	aspect-ratio: 16/10;
	overflow: hidden;
}

.project-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.project-card:hover .project-image img {
	transform: scale(1.03);
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

.tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-bottom: 1rem;
}

.tag {
	background: var(--theme-background, white);
	color: var(--theme-text-muted, #64748b);
	padding: 0.25rem 0.75rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	font-weight: 500;
}

.project-link {
	display: inline-flex;
	align-items: center;
	gap: 0.375rem;
	color: var(--theme-text, #0f172a);
	font-weight: 600;
	font-size: 0.9375rem;
	text-decoration: none;
}

.project-link:hover {
	text-decoration: underline;
}

@media (max-width: 768px) {
	.projects-grid {
		grid-template-columns: 1fr;
	}
}
</style>
