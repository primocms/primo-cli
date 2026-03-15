<section class="cta-section">
	<div class="cta-bg">
		<div class="cta-pattern"></div>
	</div>
	<div class="container">
		<div class="cta-content">
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
.cta-section {
	position: relative;
	padding: 5rem 0;
	overflow: hidden;
}

.cta-bg {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, var(--theme-primary, #ef4444) 0%, #b91c1c 100%);
}

.cta-pattern {
	position: absolute;
	inset: 0;
	background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.container {
	position: relative;
	z-index: 1;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.cta-content {
	text-align: center;
	max-width: 700px;
	margin: 0 auto;
}

h2 {
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 900;
	color: white;
	margin: 0 0 1rem;
	text-transform: uppercase;
	letter-spacing: -0.02em;
}

p {
	font-size: 1.25rem;
	color: rgba(255, 255, 255, 0.9);
	line-height: 1.7;
	margin: 0 0 2rem;
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
	background: white;
	color: var(--theme-primary, #ef4444);
	padding: 1rem 2rem;
	border-radius: 4px;
	font-weight: 700;
	font-size: 0.9375rem;
	text-decoration: none;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	transition: all 0.3s ease;
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
	display: inline-flex;
	align-items: center;
	background: transparent;
	color: white;
	padding: 1rem 2rem;
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
