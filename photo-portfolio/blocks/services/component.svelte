<section class="services" id="services">
	<div class="services-header">
		{#if title}
			<h2>{title}</h2>
		{/if}
		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}
	</div>

	{#if services?.length}
		<div class="services-grid">
			{#each services as service, i}
				<div class="service-card">
					{#if service.image?.url}
						<div class="service-image">
							<img src={service.image.url} alt={service.image.alt || service.title} loading="lazy" />
						</div>
					{/if}
					<div class="service-content">
						<span class="service-number">{String(i + 1).padStart(2, '0')}</span>
						{#if service.title}
							<h3>{service.title}</h3>
						{/if}
						{#if service.description}
							<p>{service.description}</p>
						{/if}
						{#if service.price}
							<span class="service-price">Starting at {service.price}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<style>
.services {
	padding: var(--theme-section-padding, 8rem) 0;
	background: #0a0a0a;
}

.services-header {
	max-width: 1400px;
	margin: 0 auto 5rem;
	padding: 0 2rem;
	text-align: center;
}

h2 {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: clamp(2rem, 5vw, 3.5rem);
	font-weight: 300;
	color: white;
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.5);
	margin: 0;
	font-weight: 300;
}

.services-grid {
	max-width: 1400px;
	margin: 0 auto;
	padding: 0 2rem;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.service-card {
	background: #111;
	overflow: hidden;
	transition: transform 0.4s ease;
}

.service-card:hover {
	transform: translateY(-8px);
}

.service-image {
	position: relative;
	aspect-ratio: 4/3;
	overflow: hidden;
}

.service-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.6s ease;
}

.service-card:hover .service-image img {
	transform: scale(1.08);
}

.service-content {
	padding: 2rem;
	position: relative;
}

.service-number {
	position: absolute;
	top: 2rem;
	right: 2rem;
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: 3rem;
	font-weight: 200;
	color: rgba(255, 255, 255, 0.08);
	line-height: 1;
}

h3 {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: 1.375rem;
	font-weight: 400;
	color: white;
	margin: 0 0 1rem;
}

.service-content p {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.5);
	line-height: 1.7;
	margin: 0 0 1.5rem;
}

.service-price {
	display: inline-block;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.4);
	padding-top: 1rem;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 1024px) {
	.services-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 640px) {
	.services-grid {
		grid-template-columns: 1fr;
	}

	.service-number {
		font-size: 2rem;
	}
}
</style>
