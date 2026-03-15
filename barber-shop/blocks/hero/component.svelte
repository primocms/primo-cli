<section class="hero">
	<div class="hero-bg">
		{#if image?.url}
			<img src={image.url} alt={image.alt || headline} class="hero-image" />
		{:else}
			<div class="hero-placeholder"></div>
		{/if}
		<div class="hero-overlay"></div>
	</div>

	<div class="hero-container">
		<div class="hero-content">
			<div class="tagline">Est. 1985</div>
			<h1>{headline}</h1>
			<p class="subheadline">{subheadline}</p>

			<div class="cta-group">
				{#if primary_cta?.url}
					<a href={primary_cta.url} class="btn-primary">
						{primary_cta.label}
					</a>
				{/if}
				{#if secondary_cta?.url}
					<a href={secondary_cta.url} class="btn-secondary">
						{secondary_cta.label}
					</a>
				{/if}
			</div>
		</div>
	</div>

	<div class="scroll-indicator">
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 5v14"/>
			<path d="m19 12-7 7-7-7"/>
		</svg>
	</div>
</section>

<style>
.hero {
	position: relative;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}

.hero-bg {
	position: absolute;
	inset: 0;
	z-index: 0;
}

.hero-placeholder {
	width: 100%;
	height: 100%;
	background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
}

.hero-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.hero-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		to bottom,
		rgba(0, 0, 0, 0.7) 0%,
		rgba(0, 0, 0, 0.5) 50%,
		rgba(0, 0, 0, 0.8) 100%
	);
}

.hero-container {
	position: relative;
	z-index: 1;
	max-width: 900px;
	margin: 0 auto;
	padding: 0 1.5rem;
	text-align: center;
}

.hero-content {
	max-width: 700px;
	margin: 0 auto;
}

.tagline {
	font-family: var(--theme-body-font, system-ui);
	font-size: 0.875rem;
	color: var(--theme-accent, #C9A86C);
	text-transform: uppercase;
	letter-spacing: 0.3em;
	margin-bottom: 1.5rem;
}

h1 {
	font-family: var(--theme-heading-font, 'Bebas Neue', Impact, sans-serif);
	font-size: clamp(3rem, 8vw, 6rem);
	font-weight: 700;
	color: white;
	line-height: 1;
	margin: 0 0 1.5rem;
	text-transform: uppercase;
	letter-spacing: 0.02em;
}

.subheadline {
	font-size: clamp(1rem, 2vw, 1.25rem);
	color: rgba(255, 255, 255, 0.8);
	line-height: 1.7;
	margin: 0 0 2.5rem;
}

.cta-group {
	display: flex;
	gap: 1rem;
	justify-content: center;
	flex-wrap: wrap;
}

.btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: var(--theme-accent, #C9A86C);
	color: #1a1a1a;
	padding: 1rem 2.5rem;
	font-weight: 700;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	text-decoration: none;
	transition: all 0.3s ease;
}

.btn-primary:hover {
	background: #fff;
	transform: translateY(-2px);
}

.btn-secondary {
	display: inline-flex;
	align-items: center;
	background: transparent;
	color: white;
	padding: 1rem 2.5rem;
	font-weight: 700;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	text-decoration: none;
	border: 2px solid rgba(255, 255, 255, 0.4);
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	border-color: var(--theme-accent, #C9A86C);
	color: var(--theme-accent, #C9A86C);
}

.scroll-indicator {
	position: absolute;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	color: var(--theme-accent, #C9A86C);
	animation: bounce 2s infinite;
}

@keyframes bounce {
	0%, 100% { transform: translateX(-50%) translateY(0); }
	50% { transform: translateX(-50%) translateY(10px); }
}

@media (max-width: 640px) {
	.hero {
		min-height: 90vh;
	}

	.cta-group {
		flex-direction: column;
	}

	.btn-primary,
	.btn-secondary {
		width: 100%;
		justify-content: center;
	}
}
</style>
