<section class="services" id="services">
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
			<div class="grid">
				{#each services as service, i}
					<div class="service-card" style="--delay: {i * 0.1}s">
						<div class="card-number">{String(i + 1).padStart(2, '0')}</div>
						{#if service.icon}
							<div class="icon">
								{@html service.icon}
							</div>
						{/if}
						<h3>{service.service_title}</h3>
						<p>{service.description}</p>
						{#if service.link?.url}
							<a href={service.link.url} class="learn-more">
								{service.link.label || 'Learn more'}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
							</a>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.services {
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
	background: rgba(249, 115, 22, 0.1);
	color: var(--theme-primary, #f97316);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

h2 {
	font-size: clamp(2rem, 4vw, 3rem);
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

.service-card {
	position: relative;
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 2.5rem 2rem;
	transition: all 0.4s ease;
}

.service-card:hover {
	transform: translateY(-8px);
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
	border-color: var(--theme-primary, #f97316);
}

.card-number {
	position: absolute;
	top: 1.5rem;
	right: 1.5rem;
	font-size: 0.75rem;
	font-weight: 700;
	color: var(--theme-text-muted, #94a3b8);
	opacity: 0.5;
}

.icon {
	width: 56px;
	height: 56px;
	background: linear-gradient(135deg, var(--theme-primary, #f97316) 0%, #fb923c 100%);
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 1.5rem;
	color: white;
}

.icon :global(svg) {
	width: 28px;
	height: 28px;
}

h3 {
	font-size: 1.375rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.75rem;
}

.service-card p {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0 0 1.5rem;
}

.learn-more {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--theme-primary, #f97316);
	text-decoration: none;
	transition: gap 0.3s ease;
}

.learn-more:hover {
	gap: 0.75rem;
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
