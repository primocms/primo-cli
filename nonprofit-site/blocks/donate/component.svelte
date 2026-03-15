<script>
let selected_amount = $state(null)
</script>

<section class="donate" id="donate">
	<div class="container">
		<div class="donate-card">
			<div class="donate-content">
				{#if title}
					<h2>{title}</h2>
				{/if}
				{#if subtitle}
					<p class="subtitle">{subtitle}</p>
				{/if}
			</div>

			{#if amounts?.length}
				<div class="amounts-grid">
					{#each amounts as amount, i}
						<button
							class="amount-option"
							class:selected={selected_amount === i}
							onclick={() => selected_amount = i}
						>
							<span class="amount-value">${amount.value}</span>
							<span class="amount-label">{amount.amount_label}</span>
						</button>
					{/each}
				</div>
			{/if}

			<div class="donate-action">
				{#if cta?.url}
					<a href={cta.url} class="donate-btn">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
						{cta.label}
					</a>
				{/if}
				{#if note}
					<p class="note">{note}</p>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
.donate {
	padding: var(--theme-section-padding, 6rem) 0;
	background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%);
}

.container {
	max-width: 900px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.donate-card {
	background: var(--theme-background, #ffffff);
	border-radius: 24px;
	padding: 3rem;
	box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
}

.donate-content {
	text-align: center;
	margin-bottom: 2.5rem;
}

h2 {
	font-size: clamp(1.75rem, 4vw, 2.5rem);
	font-weight: 700;
	color: var(--theme-text, #1e293b);
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0;
	max-width: 600px;
	margin: 0 auto;
}

.amounts-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 1rem;
	margin-bottom: 2rem;
}

.amount-option {
	background: var(--theme-background-secondary, #f8fafc);
	border: 2px solid var(--theme-border-color, #e2e8f0);
	border-radius: 12px;
	padding: 1.25rem 1rem;
	cursor: pointer;
	transition: all 0.3s ease;
	text-align: center;
}

.amount-option:hover {
	border-color: var(--theme-primary, #e85d04);
}

.amount-option.selected {
	background: rgba(232, 93, 4, 0.1);
	border-color: var(--theme-primary, #e85d04);
}

.amount-value {
	display: block;
	font-size: 1.5rem;
	font-weight: 700;
	color: var(--theme-text, #1e293b);
	margin-bottom: 0.25rem;
}

.amount-label {
	display: block;
	font-size: 0.75rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.4;
}

.donate-action {
	text-align: center;
}

.donate-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	background: var(--theme-primary, #e85d04);
	color: white;
	padding: 1.25rem 3rem;
	border-radius: 50px;
	font-size: 1.125rem;
	font-weight: 700;
	text-decoration: none;
	transition: all 0.3s ease;
	box-shadow: 0 4px 20px rgba(232, 93, 4, 0.4);
}

.donate-btn:hover {
	background: var(--theme-primary-dark, #dc2f02);
	transform: translateY(-2px);
	box-shadow: 0 8px 30px rgba(232, 93, 4, 0.5);
}

.note {
	font-size: 0.875rem;
	color: var(--theme-text-muted, #64748b);
	margin: 1.5rem 0 0;
}

@media (max-width: 768px) {
	.donate-card {
		padding: 2rem;
	}

	.amounts-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 480px) {
	.amounts-grid {
		grid-template-columns: 1fr 1fr;
	}

	.donate-btn {
		width: 100%;
		justify-content: center;
	}
}
</style>
