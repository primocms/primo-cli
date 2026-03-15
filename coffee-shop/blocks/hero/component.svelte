<section class="hero">
	<div class="hero-bg">
		{#if image?.url}
			<img src={image.url} alt={image.alt || headline} class="hero-image" />
		{/if}
		<div class="hero-overlay"></div>
	</div>

	<div class="hero-container">
		<div class="hero-content">
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
	background: linear-gradient(135deg, #2C1810 0%, #4A2C2A 50%, #654321 100%);
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
		rgba(44, 24, 16, 0.6) 0%,
		rgba(44, 24, 16, 0.4) 50%,
		rgba(44, 24, 16, 0.7) 100%
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

h1 {
	font-family: var(--theme-heading-font, 'Cormorant Garamond', Georgia, serif);
	font-size: clamp(2.5rem, 6vw, 4.5rem);
	font-weight: 600;
	color: white;
	line-height: 1.1;
	margin: 0 0 1.5rem;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.subheadline {
	font-size: clamp(1.125rem, 2vw, 1.375rem);
	color: rgba(255, 255, 255, 0.9);
	line-height: 1.7;
	margin: 0 0 2.5rem;
	text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
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
	background: var(--theme-primary, #8B4513);
	color: white;
	padding: 1rem 2rem;
	border-radius: 6px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
	box-shadow: 0 4px 14px rgba(139, 69, 19, 0.4);
}

.btn-primary:hover {
	background: var(--theme-primary-dark, #654321);
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(139, 69, 19, 0.5);
}

.btn-secondary {
	display: inline-flex;
	align-items: center;
	background: transparent;
	color: white;
	padding: 1rem 2rem;
	border-radius: 6px;
	font-weight: 600;
	text-decoration: none;
	border: 2px solid rgba(255, 255, 255, 0.5);
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.8);
}

.scroll-indicator {
	position: absolute;
	bottom: 2rem;
	left: 50%;
	transform: translateX(-50%);
	color: rgba(255, 255, 255, 0.6);
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
