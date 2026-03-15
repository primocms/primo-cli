<section class="about" id="about">
	<div class="about-container">
		<div class="about-image">
			{#if image?.url}
				<img src={image.url} alt={image.alt || title} />
			{/if}
		</div>

		<div class="about-content">
			{#if title}
				<h2>{title}</h2>
			{/if}

			{#if content}
				<div class="prose">
					{@html content}
				</div>
			{/if}

			{#if stats?.length}
				<div class="stats">
					{#each stats as stat}
						<div class="stat">
							<span class="stat-number">{stat.number}</span>
							<span class="stat-label">{stat.label}</span>
						</div>
					{/each}
				</div>
			{/if}

			{#if cta?.url}
				<a href={cta.url} class="about-cta">
					{cta.label}
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M7 17L17 7"/>
						<path d="M7 7h10v10"/>
					</svg>
				</a>
			{/if}
		</div>
	</div>
</section>

<style>
.about {
	padding: var(--theme-section-padding, 8rem) 0;
	background: #111;
}

.about-container {
	max-width: 1400px;
	margin: 0 auto;
	padding: 0 2rem;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 6rem;
	align-items: center;
}

.about-image {
	position: relative;
}

.about-image::before {
	content: '';
	position: absolute;
	top: 2rem;
	left: 2rem;
	right: -2rem;
	bottom: -2rem;
	border: 1px solid rgba(255, 255, 255, 0.1);
	z-index: 0;
}

.about-image img {
	position: relative;
	width: 100%;
	height: auto;
	display: block;
	z-index: 1;
}

.about-content {
	max-width: 540px;
}

h2 {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 300;
	color: white;
	margin: 0 0 2rem;
	letter-spacing: -0.02em;
}

.prose {
	color: rgba(255, 255, 255, 0.6);
	font-size: 1.0625rem;
	line-height: 1.8;
	margin-bottom: 3rem;
}

.prose :global(p) {
	margin: 0 0 1.25rem;
}

.prose :global(p:last-child) {
	margin-bottom: 0;
}

.stats {
	display: flex;
	gap: 3rem;
	margin-bottom: 3rem;
	padding-top: 2rem;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.stat {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.stat-number {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: 2.5rem;
	font-weight: 300;
	color: white;
	letter-spacing: -0.02em;
}

.stat-label {
	font-size: 0.75rem;
	font-weight: 500;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.4);
}

.about-cta {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	background: transparent;
	color: white;
	padding: 1rem 1.75rem;
	border: 1px solid rgba(255, 255, 255, 0.3);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	text-decoration: none;
	transition: all 0.4s ease;
}

.about-cta:hover {
	background: white;
	color: #0a0a0a;
	border-color: white;
}

.about-cta svg {
	transition: transform 0.4s ease;
}

.about-cta:hover svg {
	transform: translate(4px, -4px);
}

@media (max-width: 968px) {
	.about-container {
		grid-template-columns: 1fr;
		gap: 4rem;
	}

	.about-image::before {
		display: none;
	}

	.about-content {
		max-width: 100%;
	}
}

@media (max-width: 640px) {
	.stats {
		gap: 2rem;
		flex-wrap: wrap;
	}

	.stat-number {
		font-size: 2rem;
	}
}
</style>
