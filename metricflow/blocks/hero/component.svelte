<section class="hero">
	<div class="hero-bg">
		<div class="gradient-orb orb-1"></div>
		<div class="gradient-orb orb-2"></div>
		<div class="grid-pattern"></div>
	</div>

	<div class="container">
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

			{#if trusted_text}
				<p class="trusted-text">{trusted_text}</p>
			{/if}
		</div>

		{#if image?.url}
			<div class="hero-image">
				<div class="image-glow"></div>
				<div class="browser-frame">
					<div class="browser-bar">
						<div class="browser-dots">
							<span></span>
							<span></span>
							<span></span>
						</div>
						<div class="browser-address">metricflow.io/dashboard</div>
					</div>
					<img src={image.url} alt={image.alt || headline} />
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
.hero {
	position: relative;
	padding: 10rem 0 6rem;
	overflow: hidden;
	background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.hero-bg {
	position: absolute;
	inset: 0;
	z-index: 0;
	overflow: hidden;
}

.gradient-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(80px);
	opacity: 0.5;
}

.orb-1 {
	width: 600px;
	height: 600px;
	background: linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%);
	top: -200px;
	right: -100px;
}

.orb-2 {
	width: 400px;
	height: 400px;
	background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(14, 165, 233, 0.15) 100%);
	bottom: 100px;
	left: -100px;
}

.grid-pattern {
	position: absolute;
	inset: 0;
	background-image:
		linear-gradient(rgba(14, 165, 233, 0.03) 1px, transparent 1px),
		linear-gradient(90deg, rgba(14, 165, 233, 0.03) 1px, transparent 1px);
	background-size: 60px 60px;
	mask-image: linear-gradient(180deg, transparent 0%, black 20%, black 80%, transparent 100%);
}

.container {
	position: relative;
	z-index: 1;
	max-width: 1280px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.hero-content {
	text-align: center;
	max-width: 800px;
	margin: 0 auto 4rem;
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: white;
	border: 1px solid #e2e8f0;
	color: var(--theme-text, #1e293b);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 500;
	margin-bottom: 1.5rem;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
	color: var(--theme-text, #0f172a);
	line-height: 1.1;
	margin: 0 0 1.5rem;
	letter-spacing: -0.03em;
}

.subheadline {
	font-size: clamp(1.125rem, 2vw, 1.375rem);
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0 0 2rem;
}

.cta-group {
	display: flex;
	gap: 1rem;
	justify-content: center;
	flex-wrap: wrap;
	margin-bottom: 2rem;
}

.btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: var(--theme-primary, #0ea5e9);
	color: white;
	padding: 1rem 1.75rem;
	border-radius: 10px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
	box-shadow: 0 4px 14px rgba(14, 165, 233, 0.3);
}

.btn-primary:hover {
	background: var(--theme-primary-dark, #0284c7);
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(14, 165, 233, 0.4);
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
	background: white;
	color: var(--theme-text, #1e293b);
	padding: 1rem 1.75rem;
	border-radius: 10px;
	font-weight: 600;
	text-decoration: none;
	border: 1px solid #e2e8f0;
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: #f8fafc;
	border-color: #cbd5e1;
}

.trusted-text {
	font-size: 0.875rem;
	color: var(--theme-text-muted, #94a3b8);
	margin: 0;
}

.hero-image {
	position: relative;
	max-width: 1100px;
	margin: 0 auto;
}

.image-glow {
	position: absolute;
	inset: -20%;
	background: radial-gradient(ellipse at center, rgba(14, 165, 233, 0.15) 0%, transparent 70%);
	z-index: -1;
}

.browser-frame {
	background: white;
	border-radius: 12px;
	box-shadow:
		0 0 0 1px rgba(0, 0, 0, 0.05),
		0 25px 50px -12px rgba(0, 0, 0, 0.15);
	overflow: hidden;
}

.browser-bar {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.75rem 1rem;
	background: #f8fafc;
	border-bottom: 1px solid #e2e8f0;
}

.browser-dots {
	display: flex;
	gap: 0.5rem;
}

.browser-dots span {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #e2e8f0;
}

.browser-dots span:first-child {
	background: #fca5a5;
}

.browser-dots span:nth-child(2) {
	background: #fcd34d;
}

.browser-dots span:last-child {
	background: #86efac;
}

.browser-address {
	flex: 1;
	background: white;
	padding: 0.5rem 1rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	color: var(--theme-text-muted, #64748b);
	border: 1px solid #e2e8f0;
}

.browser-frame img {
	width: 100%;
	height: auto;
	display: block;
}

@media (max-width: 768px) {
	.hero {
		padding: 8rem 0 4rem;
	}

	.hero-content {
		margin-bottom: 3rem;
	}

	.cta-group {
		flex-direction: column;
	}

	.btn-primary,
	.btn-secondary {
		width: 100%;
		justify-content: center;
	}

	.browser-bar {
		display: none;
	}

	.browser-frame {
		border-radius: 8px;
	}
}
</style>
