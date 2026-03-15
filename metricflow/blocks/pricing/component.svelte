<script>
let is_annual = $state(true)

function parse_features(text) {
	if (!text) return []
	return text.split('\n').filter(f => f.trim())
}

function toggle_billing() {
	is_annual = !is_annual
}
</script>

<section class="pricing" id="pricing">
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

			<div class="billing-toggle">
				<span class:active={!is_annual}>Monthly</span>
				<button onclick={toggle_billing} class="toggle" class:annual={is_annual}>
					<span class="toggle-handle"></span>
				</button>
				<span class:active={is_annual}>
					Annual
					<span class="save-badge">Save 20%</span>
				</span>
			</div>
		</div>

		{#if plans?.length}
			<div class="plans-grid" class:three-col={plans.length === 3}>
				{#each plans as plan}
					<div class="plan-card" class:popular={plan.popular}>
						{#if plan.popular}
							<div class="popular-badge">Most Popular</div>
						{/if}

						<div class="plan-header">
							<h3>{plan.plan_name}</h3>
							<p class="plan-description">{plan.description}</p>
						</div>

						<div class="plan-price">
							<span class="price">
								{is_annual ? plan.price_annual : plan.price_monthly}
							</span>
							{#if plan.price_monthly !== 'Custom'}
								<span class="period">/month</span>
							{/if}
						</div>

						{#if plan.cta?.url}
							<a href={plan.cta.url} class="plan-cta" class:primary={plan.popular}>
								{plan.cta.label}
							</a>
						{/if}

						{#if plan.features_text}
							<ul class="features">
								{#each parse_features(plan.features_text) as feature}
									<li>
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
										{feature}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.pricing {
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
	margin: 0 0 2rem;
}

.billing-toggle {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
}

.billing-toggle span.active {
	color: var(--theme-text, #0f172a);
	font-weight: 600;
}

.toggle {
	position: relative;
	width: 52px;
	height: 28px;
	background: #e2e8f0;
	border: none;
	border-radius: 14px;
	cursor: pointer;
	transition: background 0.3s ease;
}

.toggle.annual {
	background: var(--theme-primary, #0ea5e9);
}

.toggle-handle {
	position: absolute;
	top: 3px;
	left: 3px;
	width: 22px;
	height: 22px;
	background: white;
	border-radius: 50%;
	transition: transform 0.3s ease;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle.annual .toggle-handle {
	transform: translateX(24px);
}

.save-badge {
	background: #dcfce7;
	color: #16a34a;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
	margin-left: 0.5rem;
}

.plans-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 2rem;
	max-width: 900px;
	margin: 0 auto;
}

.plans-grid.three-col {
	max-width: 1100px;
}

.plan-card {
	position: relative;
	background: white;
	border: 1px solid #e2e8f0;
	border-radius: 16px;
	padding: 2rem;
	display: flex;
	flex-direction: column;
}

.plan-card.popular {
	border-color: var(--theme-primary, #0ea5e9);
	box-shadow: 0 8px 30px rgba(14, 165, 233, 0.15);
}

.popular-badge {
	position: absolute;
	top: -12px;
	left: 50%;
	transform: translateX(-50%);
	background: linear-gradient(135deg, var(--theme-primary, #0ea5e9) 0%, #6366f1 100%);
	color: white;
	padding: 0.375rem 1rem;
	border-radius: 50px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.plan-header {
	margin-bottom: 1.5rem;
}

.plan-header h3 {
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.5rem;
}

.plan-description {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	margin: 0;
}

.plan-price {
	margin-bottom: 1.5rem;
}

.price {
	font-size: 3rem;
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	letter-spacing: -0.02em;
}

.period {
	font-size: 1rem;
	color: var(--theme-text-muted, #64748b);
}

.plan-cta {
	display: block;
	width: 100%;
	padding: 1rem;
	border-radius: 10px;
	text-align: center;
	text-decoration: none;
	font-weight: 600;
	transition: all 0.3s ease;
	background: #f1f5f9;
	color: var(--theme-text, #0f172a);
	border: 1px solid #e2e8f0;
	margin-bottom: 2rem;
}

.plan-cta:hover {
	background: #e2e8f0;
}

.plan-cta.primary {
	background: var(--theme-primary, #0ea5e9);
	color: white;
	border: none;
}

.plan-cta.primary:hover {
	background: var(--theme-primary-dark, #0284c7);
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
}

.features {
	list-style: none;
	padding: 0;
	margin: 0;
	flex: 1;
}

.features li {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	padding: 0.625rem 0;
	font-size: 0.9375rem;
	color: var(--theme-text, #0f172a);
}

.features li svg {
	flex-shrink: 0;
	color: #22c55e;
	margin-top: 0.125rem;
}

@media (max-width: 768px) {
	.plans-grid {
		grid-template-columns: 1fr;
		max-width: 400px;
	}
}
</style>
