<section class="hero">
	<div class="hero-bg">
		{#if image?.url}
			<img src={image.url} alt={image.alt || headline} class="hero-image" />
		{/if}
		<div class="hero-overlay"></div>
	</div>

	<div class="hero-container">
		<div class="hero-content">
			{#if badge}
				<div class="badge">{badge}</div>
			{/if}

			<h1>{headline}</h1>
			<p class="subheadline">{subheadline}</p>

			<div class="cta-group">
				{#if primary_cta?.url}
					<a href={primary_cta.url} class="btn-primary">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
						{primary_cta.label}
					</a>
				{/if}
				{#if secondary_cta?.url}
					<a href={secondary_cta.url} class="btn-secondary">
						{secondary_cta.label}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
					</a>
				{/if}
			</div>
		</div>
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
	background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #3d7ab8 100%);
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
		rgba(30, 58, 95, 0.7) 0%,
		rgba(30, 58, 95, 0.5) 50%,
		rgba(30, 58, 95, 0.8) 100%
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
	max-width: 750px;
	margin: 0 auto;
}

.badge {
	display: inline-block;
	background: rgba(255, 255, 255, 0.15);
	border: 1px solid rgba(255, 255, 255, 0.25);
	color: white;
	padding: 0.5rem 1.25rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1.5rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

h1 {
	font-family: var(--theme-heading-font, system-ui);
	font-size: clamp(2.5rem, 6vw, 4.5rem);
	font-weight: 700;
	color: white;
	line-height: 1.1;
	margin: 0 0 1.5rem;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.subheadline {
	font-size: clamp(1.125rem, 2vw, 1.375rem);
	color: rgba(255, 255, 255, 0.9);
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
	background: var(--theme-primary, #e85d04);
	color: white;
	padding: 1rem 2rem;
	border-radius: 50px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
	box-shadow: 0 4px 14px rgba(232, 93, 4, 0.4);
}

.btn-primary:hover {
	background: var(--theme-primary-dark, #dc2f02);
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(232, 93, 4, 0.5);
}

.btn-secondary {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: transparent;
	color: white;
	padding: 1rem 2rem;
	border-radius: 50px;
	font-weight: 600;
	text-decoration: none;
	border: 2px solid rgba(255, 255, 255, 0.5);
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.8);
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
