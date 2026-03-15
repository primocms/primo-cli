<script>
let open_index = $state(-1)

function toggle(index) {
	open_index = open_index === index ? -1 : index
}
</script>

<section class="faq" id="faq">
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

		{#if items?.length}
			<div class="faq-list">
				{#each items as item, i}
					<div class="faq-item" class:open={open_index === i}>
						<button class="faq-question" onclick={() => toggle(i)}>
							<span>{item.question}</span>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
								<path d="M6 9l6 6 6-6"/>
							</svg>
						</button>
						<div class="faq-answer">
							<p>{item.answer}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.faq {
	padding: var(--theme-section-padding, 6rem) 0;
	background: white;
}

.container {
	max-width: 800px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.header {
	text-align: center;
	margin-bottom: 4rem;
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

.faq-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.faq-item {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	overflow: hidden;
	transition: all 0.3s ease;
}

.faq-item:hover {
	border-color: #cbd5e1;
}

.faq-item.open {
	border-color: var(--theme-primary, #0ea5e9);
}

.faq-question {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 1.25rem 1.5rem;
	background: none;
	border: none;
	cursor: pointer;
	text-align: left;
	font-size: 1.0625rem;
	font-weight: 600;
	color: var(--theme-text, #0f172a);
}

.faq-question .icon {
	flex-shrink: 0;
	color: var(--theme-text-muted, #64748b);
	transition: transform 0.3s ease;
}

.faq-item.open .faq-question .icon {
	transform: rotate(180deg);
	color: var(--theme-primary, #0ea5e9);
}

.faq-answer {
	max-height: 0;
	overflow: hidden;
	transition: max-height 0.3s ease;
}

.faq-item.open .faq-answer {
	max-height: 500px;
}

.faq-answer p {
	padding: 0 1.5rem 1.25rem;
	margin: 0;
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
}
</style>
