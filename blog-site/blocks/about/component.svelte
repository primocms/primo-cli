<section class="about">
	<div class="container">
		{#if image?.url}
			<div class="about-image">
				<img src={image.url} alt={title || 'About'} />
			</div>
		{/if}

		<div class="about-content">
			{#if section_label}
				<span class="section-label">{section_label}</span>
			{/if}
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if content}
				<div class="prose">
					{@html content}
				</div>
			{/if}
			{#if cta?.url}
				<a href={cta.url} class="btn-primary">
					{cta.label}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
				</a>
			{/if}
		</div>
	</div>
</section>

<style>
.about {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background, #ffffff);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	align-items: center;
}

.about-image img {
	width: 100%;
	height: auto;
	border-radius: 16px;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.about-content {
	max-width: 520px;
}

.section-label {
	display: inline-block;
	color: var(--theme-primary, #6366f1);
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-bottom: 0.75rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Georgia', serif);
	font-size: clamp(2rem, 4vw, 2.5rem);
	font-weight: 700;
	color: var(--theme-text, #1a1a2e);
	margin: 0 0 1.5rem;
	line-height: 1.3;
}

.prose {
	font-size: 1.0625rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.8;
	margin-bottom: 2rem;
}

.prose :global(p) {
	margin: 0 0 1rem;
}

.prose :global(p:last-child) {
	margin-bottom: 0;
}

.prose :global(a) {
	color: var(--theme-primary, #6366f1);
	text-decoration: underline;
}

.prose :global(strong) {
	color: var(--theme-text, #1a1a2e);
	font-weight: 600;
}

.btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: var(--theme-primary, #6366f1);
	color: white;
	padding: 1rem 2rem;
	border-radius: 8px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.2s ease;
}

.btn-primary:hover {
	background: var(--theme-primary-dark, #4f46e5);
	transform: translateY(-1px);
}

.btn-primary svg {
	transition: transform 0.2s ease;
}

.btn-primary:hover svg {
	transform: translateX(4px);
}

@media (max-width: 968px) {
	.container {
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}

	.about-content {
		max-width: 100%;
	}
}
</style>
