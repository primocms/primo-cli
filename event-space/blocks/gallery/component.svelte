<section class="gallery" id="gallery">
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

		{#if images?.length}
			<div class="gallery-grid">
				{#each images as item, i}
					{#if item.image?.url}
						<div class="gallery-item" class:featured={i === 0 || i === 3}>
							<img src={item.image.url} alt={item.image.alt || item.caption || 'Event photo'} />
							{#if item.caption}
								<div class="caption">
									<span>{item.caption}</span>
								</div>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.gallery {
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

.gallery-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;
}

.gallery-item {
	position: relative;
	aspect-ratio: 1;
	border-radius: 8px;
	overflow: hidden;
	cursor: pointer;
}

.gallery-item.featured {
	grid-column: span 2;
	grid-row: span 2;
}

.gallery-item img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.5s;
}

.gallery-item:hover img {
	transform: scale(1.05);
}

.caption {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 1.5rem 1rem 1rem;
	background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
	color: white;
	font-size: 0.875rem;
	opacity: 0;
	transition: opacity 0.3s;
}

.gallery-item:hover .caption {
	opacity: 1;
}

@media (max-width: 768px) {
	.gallery-grid {
		grid-template-columns: repeat(2, 1fr);
	}

	.gallery-item.featured {
		grid-column: span 2;
		grid-row: span 1;
		aspect-ratio: 16/9;
	}
}

@media (max-width: 480px) {
	.gallery-grid {
		grid-template-columns: 1fr;
	}

	.gallery-item.featured {
		grid-column: span 1;
	}
}
</style>
