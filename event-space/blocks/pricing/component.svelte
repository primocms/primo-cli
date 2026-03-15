<section class="pricing">
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

		{#if packages?.length}
			<div class="pricing-grid">
				{#each packages as pkg}
					<div class="pricing-card" class:featured={pkg.featured}>
						{#if pkg.featured}
							<div class="featured-badge">Most Popular</div>
						{/if}
						<h3>{pkg.name}</h3>
						<div class="price">
							<span class="amount">{pkg.price}</span>
						</div>
						{#if pkg.description}
							<p class="package-description">{pkg.description}</p>
						{/if}
						{#if pkg.features?.length}
							<ul class="features">
								{#each pkg.features as item}
									<li>
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
										{item.feature}
									</li>
								{/each}
							</ul>
						{/if}
						{#if pkg.cta?.url}
							<a href={pkg.cta.url} class="cta-button" class:featured={pkg.featured}>
								{pkg.cta.label}
							</a>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.pricing {
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

.pricing-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
	align-items: start;
}

.pricing-card {
	position: relative;
	background: white;
	border-radius: 12px;
	padding: 2.5rem 2rem;
	box-shadow: 0 4px 20px rgba(0,0,0,0.06);
	border: 2px solid transparent;
	transition: transform 0.3s, box-shadow 0.3s;
}

.pricing-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 8px 30px rgba(0,0,0,0.1);
}

.pricing-card.featured {
	border-color: var(--theme-primary, #B8860B);
}

.featured-badge {
	position: absolute;
	top: -12px;
	left: 50%;
	transform: translateX(-50%);
	background: var(--theme-primary, #B8860B);
	color: white;
	padding: 0.375rem 1rem;
	border-radius: 50px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

h3 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--theme-text, #1a1a1a);
	margin: 0 0 1rem;
	text-align: center;
}

.price {
	text-align: center;
	margin-bottom: 1rem;
}

.amount {
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--theme-primary, #B8860B);
}

.package-description {
	text-align: center;
	color: var(--theme-text-muted, #666666);
	font-size: 0.9375rem;
	line-height: 1.6;
	margin: 0 0 1.5rem;
}

.features {
	list-style: none;
	padding: 0;
	margin: 0 0 2rem;
}

.features li {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.75rem 0;
	border-bottom: 1px solid var(--theme-border-color, #E8E0D0);
	color: var(--theme-text, #1a1a1a);
	font-size: 0.9375rem;
}

.features li:last-child {
	border-bottom: none;
}

.features svg {
	flex-shrink: 0;
	color: var(--theme-primary, #B8860B);
	margin-top: 2px;
}

.cta-button {
	display: block;
	width: 100%;
	text-align: center;
	padding: 1rem;
	border-radius: 8px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.2s;
	border: 2px solid var(--theme-primary, #B8860B);
	color: var(--theme-primary, #B8860B);
	background: transparent;
}

.cta-button:hover {
	background: var(--theme-primary, #B8860B);
	color: white;
}

.cta-button.featured {
	background: var(--theme-primary, #B8860B);
	color: white;
}

.cta-button.featured:hover {
	background: var(--theme-primary-dark, #8B6914);
	border-color: var(--theme-primary-dark, #8B6914);
}

@media (max-width: 640px) {
	.pricing-grid {
		grid-template-columns: 1fr;
	}
}
</style>
