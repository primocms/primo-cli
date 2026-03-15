<section class="cta">
	<div class="cta-bg">
		<div class="gradient-orb"></div>
		<div class="grid-pattern"></div>
	</div>

	<div class="container">
		{#if title}
			<h2>{title}</h2>
		{/if}

		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}

		<div class="cta-buttons">
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
</section>

<style>
.cta {
	position: relative;
	padding: 5rem 0;
	overflow: hidden;
}

.cta-bg {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
}

.gradient-orb {
	position: absolute;
	width: 600px;
	height: 600px;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	filter: blur(120px);
	opacity: 0.3;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.grid-pattern {
	position: absolute;
	inset: 0;
	background-image:
		linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
		linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
	background-size: 40px 40px;
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
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 800;
	color: white;
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.25rem;
	color: #94a3b8;
	line-height: 1.7;
	margin: 0 0 2.5rem;
}

.cta-buttons {
	display: flex;
	gap: 1rem;
	justify-content: center;
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

@media (max-width: 640px) {
	.cta-buttons {
		flex-direction: column;
	}

	.btn-primary,
	.btn-secondary {
		width: 100%;
		justify-content: center;
	}
}
</style>
