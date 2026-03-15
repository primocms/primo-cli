<section class="features" id="features">
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

		{#if features?.length}
			<div class="grid">
				{#each features as feature}
					<div class="feature-card">
						{#if feature.icon}
							<div class="icon">
								{@html feature.icon}
							</div>
						{/if}
						<h3>{feature.feature_title}</h3>
						<p>{feature.description}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.features {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background, #ffffff);
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

.grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.feature-card {
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 2rem;
	transition: all 0.3s ease;
}

.feature-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
	border-color: var(--theme-primary, #6366f1);
}

.icon {
	width: 48px;
	height: 48px;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 1.5rem;
	color: white;
}

.icon :global(svg) {
	width: 24px;
	height: 24px;
}

h3 {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.75rem;
}

.feature-card p {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.6;
	margin: 0;
}

@media (max-width: 968px) {
	.grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 640px) {
	.grid {
		grid-template-columns: 1fr;
	}
}
</style>