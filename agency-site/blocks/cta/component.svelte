<section class="cta">
	<div class="cta-bg">
		<div class="cta-gradient"></div>
		<div class="cta-pattern"></div>
	</div>

	<div class="container">
		<div class="content">
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if subtitle}
				<p>{subtitle}</p>
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
	</div>
</section>

<style>
.cta {
	position: relative;
	padding: 6rem 0;
	overflow: hidden;
}

.cta-bg {
	position: absolute;
	inset: 0;
	z-index: 0;
}

.cta-gradient {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
}

.cta-pattern {
	position: absolute;
	inset: 0;
	background-image: radial-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px);
	background-size: 32px 32px;
}

.container {
	position: relative;
	z-index: 1;
	max-width: 900px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.content {
	text-align: center;
}

h2 {
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 800;
	color: white;
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

p {
	font-size: 1.25rem;
	color: #94a3b8;
	line-height: 1.7;
	margin: 0 0 2.5rem;
	max-width: 600px;
	margin-left: auto;
	margin-right: auto;
}

.cta-buttons {
	display: flex;
	justify-content: center;
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
