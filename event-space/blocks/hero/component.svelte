<section class="hero" style="--bg-image: url({background_image?.url || ''})">
	<div class="hero-overlay"></div>
	<div class="container">
		<div class="hero-content">
			{#if headline}
				<h1>{headline}</h1>
			{/if}
			{#if subheadline}
				<p class="subheadline">{subheadline}</p>
			{/if}
			<div class="cta-group">
				{#if primary_cta?.url}
					<a href={primary_cta.url} class="btn-primary">{primary_cta.label}</a>
				{/if}
				{#if secondary_cta?.url}
					<a href={secondary_cta.url} class="btn-secondary">{secondary_cta.label}</a>
				{/if}
			</div>
		</div>
	</div>
	<div class="scroll-indicator">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
	</div>
</section>

<style>
.hero {
	position: relative;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background-image: var(--bg-image);
	background-size: cover;
	background-position: center;
	background-color: #1a1a1a;
}

.hero-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%);
}

.container {
	position: relative;
	z-index: 1;
	max-width: 1000px;
	margin: 0 auto;
	padding: 0 1.5rem;
	text-align: center;
}

.hero-content {
	max-width: 800px;
	margin: 0 auto;
}

h1 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: clamp(2.5rem, 6vw, 4.5rem);
	font-weight: 700;
	color: white;
	line-height: 1.1;
	margin: 0 0 1.5rem;
	text-shadow: 0 2px 20px rgba(0,0,0,0.3);
}

.subheadline {
	font-size: clamp(1.125rem, 2vw, 1.375rem);
	color: rgba(255,255,255,0.9);
	line-height: 1.6;
	margin: 0 0 2.5rem;
	max-width: 600px;
	margin-left: auto;
	margin-right: auto;
}

.cta-group {
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
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-size: 0.9rem;
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
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-size: 0.9rem;
}

.btn-secondary:hover {
	background: white;
	color: var(--theme-text, #1a1a1a);
}

.scroll-indicator {
	position: absolute;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	color: white;
	animation: bounce 2s infinite;
}

@keyframes bounce {
	0%, 20%, 50%, 80%, 100% {
		transform: translateX(-50%) translateY(0);
	}
	40% {
		transform: translateX(-50%) translateY(-10px);
	}
	60% {
		transform: translateX(-50%) translateY(-5px);
	}
}

@media (max-width: 640px) {
	.cta-group {
		flex-direction: column;
	}

	.btn-primary,
	.btn-secondary {
		width: 100%;
		text-align: center;
	}
}
</style>
