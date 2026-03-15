<section class="hero">
	<div class="hero-bg">
		<div class="hero-gradient"></div>
		<div class="hero-pattern"></div>
	</div>

	<div class="hero-container">
		<div class="hero-content">
			{#if badge}
				<div class="badge">
					<span class="badge-dot"></span>
					{badge}
				</div>
			{/if}

			<h1>{headline}</h1>
			<p class="subheadline">{subheadline}</p>

			<div class="cta-group">
				{#if primary_cta?.url}
					<a href={primary_cta.url} class="btn-primary">
						{primary_cta.label}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
					</a>
				{/if}
				{#if secondary_cta?.url}
					<a href={secondary_cta.url} class="btn-secondary">
						{secondary_cta.label}
					</a>
				{/if}
			</div>
		</div>

		{#if image?.url}
			<div class="hero-image">
				<div class="image-glow"></div>
				<img src={image.url} alt={image.alt || headline} />
			</div>
		{/if}
	</div>
</section>

<style>
.hero {
	position: relative;
	min-height: min(100vh, 800px);
	display: flex;
	align-items: center;
	padding: 6rem 0 4rem;
	overflow: hidden;
}

.hero-bg {
	position: absolute;
	inset: 0;
	z-index: 0;
}

.hero-gradient {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
}

.hero-pattern {
	position: absolute;
	inset: 0;
	background-image: radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px);
	background-size: 40px 40px;
	mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
}

.hero-container {
	position: relative;
	z-index: 1;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	align-items: center;
}

.hero-content {
	max-width: 600px;
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: rgba(99, 102, 241, 0.15);
	border: 1px solid rgba(99, 102, 241, 0.3);
	color: #a5b4fc;
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 500;
	margin-bottom: 1.5rem;
}

.badge-dot {
	width: 8px;
	height: 8px;
	background: #22c55e;
	border-radius: 50%;
	animation: pulse 2s infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}

h1 {
	font-size: clamp(2.5rem, 5vw, 4rem);
	font-weight: 800;
	color: white;
	line-height: 1.1;
	margin: 0 0 1.5rem;
	letter-spacing: -0.02em;
}

.subheadline {
	font-size: 1.25rem;
	color: #94a3b8;
	line-height: 1.7;
	margin: 0 0 2rem;
}

.cta-group {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
}

.btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	padding: 1rem 2rem;
	border-radius: 12px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
	box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
}

.btn-primary svg {
	transition: transform 0.3s ease;
}

.btn-primary:hover svg {
	transform: translateX(4px);
}

.btn-secondary {
	display: inline-flex;
	align-items: center;
	background: transparent;
	color: white;
	padding: 1rem 2rem;
	border-radius: 12px;
	font-weight: 600;
	text-decoration: none;
	border: 1px solid rgba(255, 255, 255, 0.2);
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.3);
}

.hero-image {
	position: relative;
}

.image-glow {
	position: absolute;
	inset: -20%;
	background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
	z-index: 0;
}

.hero-image img {
	position: relative;
	z-index: 1;
	width: 100%;
	height: auto;
	border-radius: 16px;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

@media (max-width: 968px) {
	.hero-container {
		grid-template-columns: 1fr;
		text-align: center;
	}

	.hero-content {
		margin: 0 auto;
	}

	.cta-group {
		justify-content: center;
	}

	.hero-image {
		max-width: 600px;
		margin: 0 auto;
	}
}

@media (max-width: 640px) {
	.hero {
		padding: 6rem 0 3rem;
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