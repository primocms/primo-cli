<section class="about" id="about">
	<div class="container">
		<div class="about-grid">
			{#if image?.url}
				<div class="about-image">
					<img src={image.url} alt={image.alt || title} />
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

				{#if skills?.length}
					<div class="skills">
						{#each skills as skill}
							<span class="skill-tag">{skill.name}</span>
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
	background: var(--theme-background-secondary, #f8fafc);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.about-grid {
	display: grid;
	grid-template-columns: 1fr 1.2fr;
	gap: 4rem;
	align-items: center;
}

.about-image img {
	width: 100%;
	height: auto;
	border-radius: 20px;
	object-fit: cover;
}

.about-content {
	max-width: 540px;
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

.skills {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 2rem;
}

.skill-tag {
	background: var(--theme-background, white);
	color: var(--theme-text, #0f172a);
	padding: 0.5rem 1rem;
	border-radius: 8px;
	font-size: 0.875rem;
	font-weight: 500;
	border: 1px solid var(--theme-border-color, #e2e8f0);
}

@media (max-width: 968px) {
	.about-grid {
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	.about-image {
		max-width: 400px;
		margin: 0 auto;
	}

	.about-content {
		max-width: 100%;
		text-align: center;
	}

	.skills {
		justify-content: center;
	}
}
</style>
