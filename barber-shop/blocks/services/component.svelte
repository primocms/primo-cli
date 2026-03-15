<section class="services" id="services">
	<div class="container">
		<div class="section-header">
			<h2>{title}</h2>
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if services?.length}
			<div class="services-grid">
				{#each services as service}
					<div class="service-card">
						<div class="service-info">
							<h3>{service.service_name}</h3>
							{#if service.description}
								<p>{service.description}</p>
							{/if}
							{#if service.duration}
								<span class="duration">{service.duration}</span>
							{/if}
						</div>
						<div class="service-price">
							{service.price}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.services {
	background: #111;
	padding: 6rem 0;
}

.container {
	max-width: 900px;
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

.services-grid {
	display: flex;
	flex-direction: column;
	gap: 1px;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.1);
}

.service-card {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 1.5rem 2rem;
	background: #111;
	transition: background 0.3s ease;
}

.service-card:hover {
	background: #1a1a1a;
}

.service-info {
	flex: 1;
}

.service-info h3 {
	font-family: var(--theme-heading-font, 'Bebas Neue', Impact, sans-serif);
	font-size: 1.5rem;
	font-weight: 700;
	color: white;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 0.25rem;
}

.service-info p {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.6);
	margin: 0 0 0.5rem;
}

.duration {
	font-size: 0.8125rem;
	color: var(--theme-accent, #C9A86C);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.service-price {
	font-family: var(--theme-heading-font, 'Bebas Neue', Impact, sans-serif);
	font-size: 1.75rem;
	font-weight: 700;
	color: var(--theme-accent, #C9A86C);
	margin-left: 2rem;
}

@media (max-width: 640px) {
	.service-card {
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
	}

	.service-price {
		margin-left: 0;
	}
}
</style>
