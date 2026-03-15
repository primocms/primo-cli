<section class="impact" id="impact">
	<div class="impact-bg"></div>

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

		{#if stats?.length}
			<div class="stats-grid">
				{#each stats as stat}
					<div class="stat-card">
						{#if stat.icon}
							<div class="stat-icon">
								{@html stat.icon}
							</div>
						{/if}
						<div class="stat-number">{stat.number}</div>
						<div class="stat-label">{stat.stat_label}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.impact {
	position: relative;
	padding: var(--theme-section-padding, 6rem) 0;
	overflow: hidden;
}

.impact-bg {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
	z-index: 0;
}

.impact-bg::before {
	content: '';
	position: absolute;
	inset: 0;
	background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
	opacity: 0.5;
}

.container {
	position: relative;
	z-index: 1;
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
	background: rgba(255, 255, 255, 0.15);
	color: white;
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
	font-weight: 700;
	color: white;
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.8);
	line-height: 1.7;
	margin: 0;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 2rem;
}

.stat-card {
	text-align: center;
	padding: 2.5rem 1.5rem;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.15);
	border-radius: 16px;
	transition: all 0.3s ease;
}

.stat-card:hover {
	transform: translateY(-4px);
	background: rgba(255, 255, 255, 0.15);
}

.stat-icon {
	width: 50px;
	height: 50px;
	background: var(--theme-primary, #e85d04);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1.25rem;
	color: white;
}

.stat-icon :global(svg) {
	width: 24px;
	height: 24px;
}

.stat-number {
	font-size: clamp(2.5rem, 4vw, 3.5rem);
	font-weight: 800;
	color: white;
	line-height: 1;
	margin-bottom: 0.5rem;
}

.stat-label {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.8);
	font-weight: 500;
}

@media (max-width: 968px) {
	.stats-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 480px) {
	.stats-grid {
		grid-template-columns: 1fr;
	}
}
</style>
