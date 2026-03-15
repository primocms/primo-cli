<section class="skills" id="skills">
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

		{#if categories?.length}
			<div class="categories-grid">
				{#each categories as category}
					<div class="category-card">
						<h3>{category.name}</h3>
						{#if category.skills?.length}
							<div class="skills-list">
								{#each category.skills as skill}
									<div class="skill-item">
										{#if skill.icon}
											<span class="skill-icon">{@html skill.icon}</span>
										{/if}
										<span class="skill-name">{skill.skill_name}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.skills {
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
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0;
}

.categories-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 2rem;
}

.category-card {
	background: var(--theme-background, #ffffff);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 2rem;
}

h3 {
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--theme-border-color, #e2e8f0);
}

.skills-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
}

.skill-item {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	padding: 0.5rem 1rem;
	border-radius: 8px;
	font-size: 0.875rem;
	color: var(--theme-text, #0f172a);
	transition: all 0.2s ease;
}

.skill-item:hover {
	border-color: var(--theme-primary, #6366f1);
	background: rgba(99, 102, 241, 0.05);
}

.skill-icon {
	display: flex;
	color: var(--theme-primary, #6366f1);
}

.skill-icon :global(svg) {
	width: 18px;
	height: 18px;
}

.skill-name {
	font-weight: 500;
}
</style>
