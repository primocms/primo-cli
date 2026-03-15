<section class="about" id="about">
	<div class="container">
		<div class="about-grid">
			{#if image?.url}
				<div class="about-image">
					<img src={image.url} alt={image.alt || title} />
					<div class="image-decoration"></div>
				</div>
			{/if}

			<div class="about-content">
				{#if badge}
					<span class="badge">{badge}</span>
				{/if}

				{#if title}
					<h2>{title}</h2>
				{/if}

				{#if bio}
					<div class="bio">
						{@html bio}
					</div>
				{/if}

				{#if stats?.length}
					<div class="stats-grid">
						{#each stats as stat}
							<div class="stat">
								<span class="stat-value">{stat.value}</span>
								<span class="stat-label">{stat.label}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
.about {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background, #ffffff);
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

.about-image {
	position: relative;
}

.about-image img {
	width: 100%;
	height: auto;
	border-radius: 20px;
	position: relative;
	z-index: 1;
}

.image-decoration {
	position: absolute;
	inset: 20px -20px -20px 20px;
	border: 2px solid var(--theme-primary, #6366f1);
	border-radius: 20px;
	z-index: 0;
}

.about-content {
	max-width: 560px;
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
	margin: 0 0 1.5rem;
	letter-spacing: -0.02em;
}

.bio {
	font-size: 1.0625rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.8;
}

.bio :global(p) {
	margin: 0 0 1rem;
}

.bio :global(p:last-child) {
	margin-bottom: 0;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
	margin-top: 2.5rem;
	padding-top: 2.5rem;
	border-top: 1px solid var(--theme-border-color, #e2e8f0);
}

.stat {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.stat-value {
	font-size: 2rem;
	font-weight: 800;
	color: var(--theme-primary, #6366f1);
	letter-spacing: -0.02em;
}

.stat-label {
	font-size: 0.875rem;
	color: var(--theme-text-muted, #64748b);
}

@media (max-width: 968px) {
	.about-grid {
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	.about-image {
		max-width: 500px;
		margin: 0 auto;
	}

	.about-content {
		max-width: 100%;
	}
}

@media (max-width: 640px) {
	.stats-grid {
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	.stat {
		flex-direction: row;
		align-items: baseline;
		gap: 0.75rem;
	}
}
</style>
