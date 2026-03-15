<section class="stats">
	<div class="container">
		{#if stats?.length}
			<div class="stats-grid">
				{#each stats as stat}
					<div class="stat-item">
						<div class="stat-value">{stat.value}</div>
						<div class="stat-label">{stat.label}</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.stats {
	padding: 4rem 0;
	background: white;
	border-top: 1px solid #f1f5f9;
	border-bottom: 1px solid #f1f5f9;
}

.container {
	max-width: 1280px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 2rem;
}

.stat-item {
	text-align: center;
	padding: 1rem;
}

.stat-value {
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	letter-spacing: -0.02em;
	line-height: 1;
	margin-bottom: 0.5rem;
	background: linear-gradient(135deg, var(--theme-primary, #0ea5e9) 0%, #6366f1 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.stat-label {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	font-weight: 500;
}

@media (max-width: 768px) {
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
