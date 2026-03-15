<section class="hero">
	<div class="hero-bg">
		{#if background_image?.url}
			<img src={background_image.url} alt="" class="bg-image" />
		{/if}
		<div class="hero-overlay"></div>
	</div>

	<div class="hero-container">
		<div class="hero-content">
			{#if badge}
				<div class="badge">
					{badge}
				</div>
			{/if}

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

			<div class="stats">
				<div class="stat">
					<span class="stat-number">500+</span>
					<span class="stat-label">Members</span>
				</div>
				<div class="stat">
					<span class="stat-number">15+</span>
					<span class="stat-label">Trainers</span>
				</div>
				<div class="stat">
					<span class="stat-number">50+</span>
					<span class="stat-label">Classes</span>
				</div>
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
	padding: 8rem 0 4rem;
	overflow: hidden;
}

.hero-bg {
	position: absolute;
	inset: 0;
	z-index: 0;
}

.bg-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.hero-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, rgba(0, 0, 0, 0.7) 100%);
}

.hero-container {
	position: relative;
	z-index: 1;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.hero-content {
	max-width: 700px;
}

.badge {
	display: inline-flex;
	align-items: center;
	background: var(--theme-primary, #ef4444);
	color: white;
	padding: 0.5rem 1rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-bottom: 1.5rem;
}

h1 {
	font-size: clamp(3rem, 6vw, 5rem);
	font-weight: 900;
	color: white;
	line-height: 1.05;
	margin: 0 0 1.5rem;
	text-transform: uppercase;
	letter-spacing: -0.02em;
}

.subheadline {
	font-size: 1.25rem;
	color: rgba(255, 255, 255, 0.8);
	line-height: 1.7;
	margin: 0 0 2.5rem;
}

.cta-group {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	margin-bottom: 3rem;
}

.btn-primary {
	display: inline-flex;
	align-items: center;
	background: var(--theme-primary, #ef4444);
	color: white;
	padding: 1.125rem 2.5rem;
	border-radius: 4px;
	font-weight: 700;
	font-size: 0.9375rem;
	text-decoration: none;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	transition: all 0.3s ease;
}

.btn-primary:hover {
	background: var(--theme-primary-dark, #dc2626);
	transform: translateY(-2px);
}

.btn-secondary {
	display: inline-flex;
	align-items: center;
	background: transparent;
	color: white;
	padding: 1.125rem 2.5rem;
	border-radius: 4px;
	font-weight: 700;
	font-size: 0.9375rem;
	text-decoration: none;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	border: 2px solid rgba(255, 255, 255, 0.5);
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: white;
}

.stats {
	display: flex;
	gap: 3rem;
}

.stat {
	display: flex;
	flex-direction: column;
}

.stat-number {
	font-size: 2.5rem;
	font-weight: 900;
	color: var(--theme-primary, #ef4444);
	line-height: 1;
}

.stat-label {
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.7);
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-top: 0.25rem;
}

@media (max-width: 768px) {
	.hero {
		padding: 7rem 0 3rem;
	}

	.cta-group {
		flex-direction: column;
	}

	.btn-primary,
	.btn-secondary {
		width: 100%;
		justify-content: center;
	}

	.stats {
		gap: 2rem;
	}

	.stat-number {
		font-size: 2rem;
	}
}
</style>
