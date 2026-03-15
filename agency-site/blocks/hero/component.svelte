<section class="hero">
	<div class="hero-bg">
		<div class="hero-gradient"></div>
		<div class="hero-shapes">
			<div class="shape shape-1"></div>
			<div class="shape shape-2"></div>
			<div class="shape shape-3"></div>
		</div>
	</div>

	<div class="container">
		<div class="hero-content">
			{#if badge}
				<div class="badge">{badge}</div>
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
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
						{secondary_cta.label}
					</a>
				{/if}
			</div>
		</div>

		{#if image?.url}
			<div class="hero-visual">
				<div class="image-frame">
					<img src={image.url} alt={image.alt || headline} />
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
.hero {
	position: relative;
	min-height: 100vh;
	display: flex;
	align-items: center;
	padding: 8rem 0 6rem;
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
	background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
}

.hero-shapes {
	position: absolute;
	inset: 0;
	overflow: hidden;
}

.shape {
	position: absolute;
	border-radius: 50%;
	filter: blur(100px);
	opacity: 0.5;
}

.shape-1 {
	width: 600px;
	height: 600px;
	background: var(--theme-primary, #f97316);
	top: -200px;
	right: -100px;
}

.shape-2 {
	width: 400px;
	height: 400px;
	background: #8b5cf6;
	bottom: -100px;
	left: -100px;
}

.shape-3 {
	width: 300px;
	height: 300px;
	background: #06b6d4;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.container {
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
	display: inline-block;
	background: rgba(249, 115, 22, 0.15);
	border: 1px solid rgba(249, 115, 22, 0.3);
	color: #fb923c;
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1.5rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

h1 {
	font-size: clamp(3rem, 6vw, 5rem);
	font-weight: 900;
	color: white;
	line-height: 1.05;
	margin: 0 0 1.5rem;
	letter-spacing: -0.03em;
}

.subheadline {
	font-size: 1.25rem;
	color: #94a3b8;
	line-height: 1.7;
	margin: 0 0 2.5rem;
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
	background: var(--theme-primary, #f97316);
	color: white;
	padding: 1rem 2rem;
	border-radius: 8px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(249, 115, 22, 0.4);
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
	gap: 0.5rem;
	background: transparent;
	color: white;
	padding: 1rem 2rem;
	border-radius: 8px;
	font-weight: 600;
	text-decoration: none;
	border: 1px solid rgba(255, 255, 255, 0.2);
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.3);
}

.hero-visual {
	position: relative;
}

.image-frame {
	position: relative;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
}

.image-frame::before {
	content: '';
	position: absolute;
	inset: 0;
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 16px;
	pointer-events: none;
	z-index: 1;
}

.hero-visual img {
	width: 100%;
	height: auto;
	display: block;
}

@media (max-width: 968px) {
	.container {
		grid-template-columns: 1fr;
		text-align: center;
	}

	.hero-content {
		margin: 0 auto;
	}

	.cta-group {
		justify-content: center;
	}

	.hero-visual {
		max-width: 600px;
		margin: 0 auto;
	}
}

@media (max-width: 640px) {
	.hero {
		padding: 6rem 0 4rem;
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
