<section class="process" id="process">
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
			<div class="timeline">
				{#each steps as step, i}
					<div class="step">
						<div class="step-marker">
							<div class="step-number">{String(i + 1).padStart(2, '0')}</div>
							{#if i < steps.length - 1}
								<div class="step-line"></div>
							{/if}
						</div>
						<div class="step-content">
							{#if step.icon}
								<div class="icon">
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
.process {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #f8fafc);
}

.container {
	max-width: 900px;
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

.timeline {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.step {
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 2rem;
}

.step-marker {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.step-number {
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: var(--theme-primary, #f97316);
	color: white;
	font-size: 1.25rem;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.step-line {
	width: 2px;
	flex: 1;
	background: linear-gradient(to bottom, var(--theme-primary, #f97316), transparent);
	margin-top: 1rem;
}

.step-content {
	padding-bottom: 3rem;
}

.icon {
	width: 48px;
	height: 48px;
	background: white;
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 1rem;
	color: var(--theme-primary, #f97316);
}

.icon :global(svg) {
	width: 24px;
	height: 24px;
}

h3 {
	font-size: 1.375rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.75rem;
}

.step-content p {
	font-size: 1rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0;
}

@media (max-width: 640px) {
	.step {
		grid-template-columns: 60px 1fr;
		gap: 1rem;
	}

	.step-number {
		width: 48px;
		height: 48px;
		font-size: 1rem;
	}
}
</style>
