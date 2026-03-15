<section class="services">
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

		{#if services?.length}
			<div class="services-grid">
				{#each services as service}
					<div class="service-card">
						{#if service.icon}
							<div class="service-icon">
								{@html service.icon}
							</div>
						{/if}
						<h3>{service.service_title}</h3>
						{#if service.description}
							<p>{service.description}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.services {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background-secondary, #F5F1E8);
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

.services-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 2rem;
}

.service-card {
	background: white;
	padding: 2rem;
	border-radius: 12px;
	text-align: center;
	box-shadow: 0 2px 12px rgba(0,0,0,0.06);
	transition: transform 0.3s, box-shadow 0.3s;
}

.service-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.service-icon {
	width: 64px;
	height: 64px;
	margin: 0 auto 1.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, var(--theme-primary, #B8860B) 0%, var(--theme-primary-dark, #8B6914) 100%);
	border-radius: 12px;
	color: white;
}

.service-icon :global(svg) {
	width: 28px;
	height: 28px;
}

h3 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--theme-text, #1a1a1a);
	margin: 0 0 0.75rem;
}

p {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #666666);
	line-height: 1.6;
	margin: 0;
}

@media (max-width: 640px) {
	.services-grid {
		grid-template-columns: 1fr;
	}
}
</style>
