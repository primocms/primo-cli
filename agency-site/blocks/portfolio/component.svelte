<section class="portfolio" id="work">
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
			<div class="grid">
				{#each projects as project, i}
					<a href={project.link?.url || '#'} class="project-card" class:featured={i === 0}>
						<div class="image-wrapper">
							{#if project.image?.url}
								<img src={project.image.url} alt={project.image.alt || project.project_title} />
							{:else}
								<div class="placeholder"></div>
							{/if}
							<div class="overlay">
								<span class="view-project">
									View Project
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
								</span>
							</div>
						</div>
						<div class="content">
							{#if project.category}
								<span class="category">{project.category}</span>
							{/if}
							<h3>{project.project_title}</h3>
							{#if project.description}
								<p>{project.description}</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.portfolio {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #0f172a);
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
	background: rgba(249, 115, 22, 0.15);
	color: #fb923c;
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

h2 {
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 800;
	color: white;
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: #94a3b8;
	line-height: 1.7;
	margin: 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 2rem;
}

.project-card {
	position: relative;
	text-decoration: none;
	border-radius: 16px;
	overflow: hidden;
	background: #1e293b;
	transition: transform 0.4s ease;
}

.project-card:hover {
	transform: translateY(-8px);
}

.project-card.featured {
	grid-column: span 2;
}

.image-wrapper {
	position: relative;
	aspect-ratio: 16/10;
	overflow: hidden;
}

.featured .image-wrapper {
	aspect-ratio: 21/9;
}

.image-wrapper img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.6s ease;
}

.project-card:hover .image-wrapper img {
	transform: scale(1.05);
}

.placeholder {
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

.overlay {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.3s ease;
}

.project-card:hover .overlay {
	opacity: 1;
}

.view-project {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: var(--theme-primary, #f97316);
	color: white;
	padding: 0.75rem 1.5rem;
	border-radius: 8px;
	font-weight: 600;
	font-size: 0.875rem;
	transform: translateY(10px);
	transition: transform 0.3s ease;
}

.project-card:hover .view-project {
	transform: translateY(0);
}

.content {
	padding: 1.5rem;
}

.category {
	display: inline-block;
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--theme-primary, #f97316);
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.5rem;
}

h3 {
	font-size: 1.25rem;
	font-weight: 700;
	color: white;
	margin: 0 0 0.5rem;
}

.content p {
	font-size: 0.875rem;
	color: #94a3b8;
	line-height: 1.6;
	margin: 0;
}

@media (max-width: 768px) {
	.grid {
		grid-template-columns: 1fr;
	}

	.project-card.featured {
		grid-column: span 1;
	}
}
</style>
