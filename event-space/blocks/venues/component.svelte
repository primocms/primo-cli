<section class="venues">
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

		{#if venues?.length}
			<div class="venues-grid">
				{#each venues as venue}
					<article class="venue-card">
						{#if venue.image?.url}
							<div class="venue-image">
								<img src={venue.image.url} alt={venue.image.alt || venue.name} />
							</div>
						{/if}
						<div class="venue-content">
							<h3>{venue.name}</h3>
							<div class="venue-meta">
								{#if venue.capacity}
									<span class="meta-item">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
										{venue.capacity}
									</span>
								{/if}
								{#if venue.size}
									<span class="meta-item">
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
										{venue.size}
									</span>
								{/if}
							</div>
							{#if venue.description}
								<p class="venue-description">{venue.description}</p>
							{/if}
							{#if venue.link?.url}
								<a href={venue.link.url} class="venue-link">
									{venue.link.label}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
.venues {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background, #FDFBF7);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.header {
	text-align: center;
	margin-bottom: 4rem;
}

.badge {
	display: inline-block;
	background: var(--theme-primary, #B8860B);
	color: white;
	padding: 0.375rem 1rem;
	border-radius: 50px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-bottom: 1rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 700;
	color: var(--theme-text, #1a1a1a);
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #666666);
	max-width: 600px;
	margin: 0 auto;
	line-height: 1.6;
}

.venues-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
	gap: 2rem;
}

.venue-card {
	background: white;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(0,0,0,0.08);
	transition: transform 0.3s, box-shadow 0.3s;
}

.venue-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}

.venue-image {
	position: relative;
	aspect-ratio: 16/10;
	overflow: hidden;
}

.venue-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.5s;
}

.venue-card:hover .venue-image img {
	transform: scale(1.05);
}

.venue-content {
	padding: 1.5rem;
}

h3 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--theme-text, #1a1a1a);
	margin: 0 0 0.75rem;
}

.venue-meta {
	display: flex;
	gap: 1.5rem;
	margin-bottom: 1rem;
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	font-size: 0.875rem;
	color: var(--theme-text-muted, #666666);
}

.meta-item svg {
	color: var(--theme-primary, #B8860B);
}

.venue-description {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #666666);
	line-height: 1.6;
	margin: 0 0 1rem;
}

.venue-link {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--theme-primary, #B8860B);
	font-weight: 600;
	text-decoration: none;
	font-size: 0.9375rem;
	transition: gap 0.2s;
}

.venue-link:hover {
	gap: 0.75rem;
}

@media (max-width: 640px) {
	.venues-grid {
		grid-template-columns: 1fr;
	}
}
</style>
