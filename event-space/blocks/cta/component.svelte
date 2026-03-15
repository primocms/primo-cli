<section class="cta" style="--bg-image: url({background_image?.url || ''})">
	<div class="overlay"></div>
	<div class="container">
		{#if title}
			<h2>{title}</h2>
		{/if}
		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}
		<div class="cta-buttons">
			{#if primary_cta?.url}
				<a href={primary_cta.url} class="btn-primary">{primary_cta.label}</a>
			{/if}
			{#if secondary_cta?.url}
				<a href={secondary_cta.url} class="btn-secondary">{secondary_cta.label}</a>
			{/if}
		</div>
	</div>
</section>

<style>
.cta {
	position: relative;
	padding: 6rem 0;
	background-image: var(--bg-image);
	background-size: cover;
	background-position: center;
	background-color: #1a1a1a;
}

.overlay {
	position: absolute;
	inset: 0;
	background: rgba(0,0,0,0.7);
}

.container {
	position: relative;
	z-index: 1;
	max-width: 800px;
	margin: 0 auto;
	padding: 0 1.5rem;
	text-align: center;
}

h2 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 700;
	color: white;
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255,255,255,0.85);
	line-height: 1.6;
	margin: 0 0 2rem;
}

.cta-buttons {
	display: flex;
	gap: 1rem;
	justify-content: center;
	flex-wrap: wrap;
}

.btn-primary {
	display: inline-block;
	background: var(--theme-primary, #B8860B);
	color: white;
	padding: 1rem 2.5rem;
	border-radius: 4px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
}

.btn-primary:hover {
	background: var(--theme-primary-dark, #8B6914);
	transform: translateY(-2px);
}

.btn-secondary {
	display: inline-block;
	background: transparent;
	color: white;
	padding: 1rem 2.5rem;
	border-radius: 4px;
	font-weight: 600;
	text-decoration: none;
	border: 2px solid white;
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: white;
	color: var(--theme-text, #1a1a1a);
}

@media (max-width: 480px) {
	.cta-buttons {
		flex-direction: column;
	}

	.btn-primary,
	.btn-secondary {
		width: 100%;
		text-align: center;
	}
}
</style>
