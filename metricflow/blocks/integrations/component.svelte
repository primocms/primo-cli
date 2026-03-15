<section class="integrations" id="integrations">
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

		{#if integrations?.length}
			<div class="integrations-grid">
				{#each integrations as integration}
					<div class="integration-card">
						{#if integration.icon}
							<div class="icon">
								{@html integration.icon}
							</div>
						{:else}
							<div class="icon placeholder">
								{integration.name?.charAt(0) || '?'}
							</div>
						{/if}
						<div class="integration-info">
							<span class="integration-name">{integration.name}</span>
							{#if integration.category}
								<span class="integration-category">{integration.category}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		{#if cta?.url}
			<div class="cta-wrapper">
				<a href={cta.url} class="view-all">
					{cta.label}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
				</a>
			</div>
		{/if}
	</div>
</section>

<style>
.integrations {
	padding: var(--theme-section-padding, 6rem) 0;
	background: #f8fafc;
}

.container {
	max-width: 1280px;
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
	background: rgba(14, 165, 233, 0.1);
	color: var(--theme-primary, #0ea5e9);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
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

.integrations-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 1.5rem;
	margin-bottom: 3rem;
}

.integration-card {
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 1.5rem;
	display: flex;
	align-items: center;
	gap: 1rem;
	transition: all 0.3s ease;
}

.integration-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
	border-color: var(--theme-primary, #0ea5e9);
}

.icon {
	width: 48px;
	height: 48px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: #f1f5f9;
	color: var(--theme-text, #1e293b);
}

.icon :global(svg) {
	width: 24px;
	height: 24px;
}

.icon.placeholder {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-primary, #0ea5e9);
}

.integration-info {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.integration-name {
	font-weight: 600;
	color: var(--theme-text, #0f172a);
	font-size: 0.9375rem;
}

.integration-category {
	font-size: 0.8125rem;
	color: var(--theme-text-muted, #64748b);
}

.cta-wrapper {
	text-align: center;
}

.view-all {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--theme-primary, #0ea5e9);
	font-weight: 600;
	text-decoration: none;
	transition: gap 0.2s ease;
}

.view-all:hover {
	gap: 0.75rem;
}

@media (max-width: 968px) {
	.integrations-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}

@media (max-width: 768px) {
	.integrations-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 480px) {
	.integrations-grid {
		grid-template-columns: 1fr;
	}
}
</style>
