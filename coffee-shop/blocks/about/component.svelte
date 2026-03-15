<section class="about" id="about">
	<div class="container">
		<div class="about-grid">
			<div class="about-content">
				{#if title}
					<h2>{title}</h2>
				{/if}
				{#if content}
					<div class="prose">
						{@html content}
					</div>
				{/if}

				{#if features?.length}
					<div class="features">
						{#each features as feature}
							<div class="feature">
								{#if feature.icon}
									<div class="feature-icon">
										{@html feature.icon}
									</div>
								{/if}
								<div class="feature-text">
									<h4>{feature.feature_title}</h4>
									<p>{feature.description}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="about-image">
				{#if image?.url}
					<img src={image.url} alt={image.alt || title} />
				{:else}
					<div class="image-placeholder">
						<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
							<path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>
							<line x1="6" x2="6" y1="2" y2="4"/>
							<line x1="10" x2="10" y1="2" y2="4"/>
							<line x1="14" x2="14" y1="2" y2="4"/>
						</svg>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
.about {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background-secondary, #F5EBE0);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.about-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	align-items: center;
}

.about-content {
	max-width: 550px;
}

h2 {
	font-family: var(--theme-heading-font, 'Cormorant Garamond', Georgia, serif);
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 600;
	color: var(--theme-text, #2C1810);
	margin: 0 0 1.5rem;
}

.prose {
	color: var(--theme-text-muted, #6B5B4F);
	font-size: 1.0625rem;
	line-height: 1.7;
}

.prose :global(p) {
	margin: 0 0 1rem;
}

.prose :global(p:last-child) {
	margin-bottom: 0;
}

.features {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	margin-top: 2.5rem;
}

.feature {
	display: flex;
	gap: 1rem;
	align-items: flex-start;
}

.feature-icon {
	flex-shrink: 0;
	width: 48px;
	height: 48px;
	background: var(--theme-primary, #8B4513);
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
}

.feature-icon :global(svg) {
	width: 24px;
	height: 24px;
}

.feature-text h4 {
	font-family: var(--theme-body-font, 'Source Sans 3', system-ui, sans-serif);
	font-size: 1rem;
	font-weight: 600;
	color: var(--theme-text, #2C1810);
	margin: 0 0 0.25rem;
}

.feature-text p {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #6B5B4F);
	margin: 0;
	line-height: 1.5;
}

.about-image {
	position: relative;
}

.about-image img {
	width: 100%;
	height: auto;
	border-radius: 12px;
	box-shadow: 0 20px 40px rgba(44, 24, 16, 0.15);
}

.image-placeholder {
	aspect-ratio: 4/3;
	background: linear-gradient(135deg, #D4A574 0%, #8B4513 100%);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 968px) {
	.about-grid {
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	.about-content {
		max-width: 100%;
		order: 2;
	}

	.about-image {
		order: 1;
	}
}
</style>
