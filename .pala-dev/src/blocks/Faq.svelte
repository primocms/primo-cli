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
			<div class="questions">
				{#each (items || []) as item, i}
					<div class="question-item" class:open={open_index === i}>
						<button class="question-toggle" onclick={() => toggle(i)}>
							<span>{item?.question}</span>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
						</button>
						<div class="answer">
							<p>{item?.answer}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<script>
	let { badge = '', title = '', subtitle = '', items = [], question = '', answer = '' } = $props()

	let open_index = $state(-1)
	
	function toggle(index) {
		open_index = open_index === index ? -1 : index
	}
</script>

<style>
.faq {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background, #ffffff);
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

.questions {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.question-item {
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 12px;
	overflow: hidden;
}

.question-toggle {
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

.question-toggle svg {
	flex-shrink: 0;
	color: var(--theme-text-muted, #64748b);
	transition: transform 0.3s ease;
}

.question-item.open .question-toggle svg {
	transform: rotate(180deg);
}

.answer {
	max-height: 0;
	overflow: hidden;
	transition: max-height 0.3s ease, padding 0.3s ease;
}

.question-item.open .answer {
	max-height: 300px;
}

.answer p {
	padding: 0 1.5rem 1.25rem;
	margin: 0;
	font-size: 1rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
}
</style>
