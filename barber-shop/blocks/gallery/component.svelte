<section class="gallery" id="gallery">
	<div class="container">
		<div class="section-header">
			<h2>{title}</h2>
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if images?.length}
			<div class="gallery-grid">
				{#each images as item, i}
					<div class="gallery-item" class:large={i === 0 || i === 3}>
						{#if item.image?.url}
							<img src={item.image.url} alt={item.image.alt || item.caption || 'Gallery image'} />
						{:else}
							<div class="placeholder"></div>
						{/if}
						{#if item.caption}
							<div class="caption">{item.caption}</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.gallery {
	background: #0a0a0a;
	padding: 6rem 0;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.section-header {
	text-align: center;
	margin-bottom: 4rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Bebas Neue', Impact, sans-serif);
	font-size: clamp(2.5rem, 5vw, 3.5rem);
	font-weight: 700;
	color: white;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.6);
	max-width: 500px;
	margin: 0 auto;
}

.gallery-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;
}

.gallery-item {
	position: relative;
	aspect-ratio: 1;
	overflow: hidden;
	background: #1a1a1a;
}

.gallery-item.large {
	grid-column: span 2;
	aspect-ratio: 2/1;
}

.gallery-item img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.5s ease;
}

.gallery-item:hover img {
	transform: scale(1.05);
}

.placeholder {
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
}

.caption {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 1.5rem;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
	color: white;
	font-size: 0.9375rem;
	font-weight: 500;
	opacity: 0;
	transform: translateY(10px);
	transition: all 0.3s ease;
}

.gallery-item:hover .caption {
	opacity: 1;
	transform: translateY(0);
}

@media (max-width: 768px) {
	.gallery-grid {
		grid-template-columns: repeat(2, 1fr);
	}

	.gallery-item.large {
		grid-column: span 2;
	}
}

@media (max-width: 480px) {
	.gallery-grid {
		grid-template-columns: 1fr;
	}

	.gallery-item,
	.gallery-item.large {
		grid-column: span 1;
		aspect-ratio: 4/3;
	}
}
</style>
