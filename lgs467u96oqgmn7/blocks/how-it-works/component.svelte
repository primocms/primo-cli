<section class="how-it-works">
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

		{#if steps?.length}
			<div class="steps">
				{#each steps as step, i}
					<div class="step">
						<div class="step-number">
							<span>{String(i + 1).padStart(2, '0')}</span>
							{#if i < steps.length - 1}
								<div class="connector"></div>
							{/if}
						</div>
						<div class="step-content">
							{#if step.icon}
								<div class="step-icon">
									{@html step.icon}
								</div>
							{/if}
							<h3>{step.step_title}</h3>
							<p>{step.description}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.how-it-works {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #f8fafc);
}

.container {
	max-width: 1000px;
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

.steps {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.step {
	display: flex;
	gap: 2rem;
}

.step-number {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-shrink: 0;
}

.step-number span {
	width: 48px;
	height: 48px;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 1rem;
}

.connector {
	width: 2px;
	flex: 1;
	min-height: 60px;
	background: linear-gradient(180deg, #6366f1 0%, #e2e8f0 100%);
	margin: 0.5rem 0;
}

.step-content {
	flex: 1;
	background: white;
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 2rem;
	margin-bottom: 1.5rem;
}

.step-icon {
	width: 40px;
	height: 40px;
	color: var(--theme-primary, #6366f1);
	margin-bottom: 1rem;
}

.step-icon :global(svg) {
	width: 100%;
	height: 100%;
}

.step-content h3 {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.75rem;
}

.step-content p {
	font-size: 1rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.6;
	margin: 0;
}

@media (max-width: 640px) {
	.step {
		gap: 1rem;
	}

	.step-number span {
		width: 40px;
		height: 40px;
		font-size: 0.875rem;
	}

	.step-content {
		padding: 1.5rem;
	}
}
</style>