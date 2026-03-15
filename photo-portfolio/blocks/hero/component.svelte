<section class="hero">
	<div class="hero-bg">
		{#if image?.url}
			<img src={image.url} alt={image.alt || headline} class="hero-image" />
		{/if}
		<div class="hero-overlay"></div>
	</div>

	<div class="hero-content">
		<h1>{headline}</h1>
		{#if subheadline}
			<p class="subheadline">{subheadline}</p>
		{/if}

		{#if cta?.url}
			<a href={cta.url} class="hero-cta">
				{cta.label}
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M7 17L17 7"/>
					<path d="M7 7h10v10"/>
				</svg>
			</a>
		{/if}
	</div>

	<div class="scroll-hint">
		<span>Scroll</span>
		<div class="scroll-line"></div>
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
	background: #0a0a0a;
}

.hero-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0.7;
}

.hero-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(
		to bottom,
		rgba(10, 10, 10, 0.3) 0%,
		rgba(10, 10, 10, 0.1) 40%,
		rgba(10, 10, 10, 0.5) 100%
	);
}

.hero-content {
	position: relative;
	z-index: 1;
	text-align: center;
	max-width: 900px;
	padding: 0 2rem;
}

h1 {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: clamp(3rem, 10vw, 7rem);
	font-weight: 300;
	color: white;
	line-height: 1.05;
	margin: 0 0 1.5rem;
	letter-spacing: -0.02em;
}

.subheadline {
	font-size: clamp(1rem, 2vw, 1.25rem);
	color: rgba(255, 255, 255, 0.7);
	line-height: 1.7;
	margin: 0 0 3rem;
	font-weight: 300;
	letter-spacing: 0.02em;
}

.hero-cta {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	background: transparent;
	color: white;
	padding: 1rem 2rem;
	border: 1px solid rgba(255, 255, 255, 0.4);
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.15em;
	text-transform: uppercase;
	text-decoration: none;
	transition: all 0.4s ease;
}

.hero-cta:hover {
	background: white;
	color: #0a0a0a;
	border-color: white;
}

.hero-cta svg {
	transition: transform 0.4s ease;
}

.hero-cta:hover svg {
	transform: translate(4px, -4px);
}

.scroll-hint {
	position: absolute;
	bottom: 3rem;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.75rem;
	color: rgba(255, 255, 255, 0.5);
}

.scroll-hint span {
	font-size: 0.625rem;
	font-weight: 500;
	letter-spacing: 0.2em;
	text-transform: uppercase;
}

.scroll-line {
	width: 1px;
	height: 60px;
	background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), transparent);
	animation: scroll-pulse 2s ease-in-out infinite;
}

@keyframes scroll-pulse {
	0%, 100% { opacity: 0.3; height: 60px; }
	50% { opacity: 1; height: 80px; }
}

@media (max-width: 640px) {
	.hero-content {
		padding: 0 1.5rem;
	}

	.scroll-hint {
		bottom: 2rem;
	}
}
</style>
