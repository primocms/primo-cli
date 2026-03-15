<section class="programs" id="programs">
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

		{#if programs?.length}
			<div class="programs-grid">
				{#each programs as program}
					<div class="program-card">
						{#if program.image?.url}
							<div class="program-image">
								<img src={program.image.url} alt={program.image.alt || program.program_title} />
								<div class="image-overlay"></div>
							</div>
						{/if}
						<div class="program-content">
							<h3>{program.program_title}</h3>
							<p>{program.description}</p>
							{#if program.link?.url}
								<a href={program.link.url} class="learn-more">
									{program.link.label || 'Learn More'}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.programs {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #f8fafc);
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
	background: rgba(232, 93, 4, 0.1);
	color: var(--theme-primary, #e85d04);
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
	font-weight: 700;
	color: var(--theme-text, #1e293b);
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0;
}

.programs-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.program-card {
	background: var(--theme-background, #ffffff);
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;
}

.program-card:hover {
	transform: translateY(-8px);
	box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
}

.program-image {
	position: relative;
	height: 200px;
	overflow: hidden;
}

.program-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.4s ease;
}

.program-card:hover .program-image img {
	transform: scale(1.05);
}

.image-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		to bottom,
		transparent 50%,
		rgba(0, 0, 0, 0.3) 100%
	);
}

.program-content {
	padding: 1.75rem;
}

.program-content h3 {
	font-size: 1.375rem;
	font-weight: 700;
	color: var(--theme-text, #1e293b);
	margin: 0 0 0.75rem;
}

.program-content p {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0 0 1.25rem;
}

.learn-more {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--theme-primary, #e85d04);
	text-decoration: none;
	transition: gap 0.3s ease;
}

.learn-more:hover {
	gap: 0.75rem;
}

@media (max-width: 968px) {
	.programs-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 640px) {
	.programs-grid {
		grid-template-columns: 1fr;
	}
}
</style>
