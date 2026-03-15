<section class="mission" id="mission">
	<div class="container">
		<div class="content-grid">
			<div class="text-content">
				{#if badge}
					<span class="badge">{badge}</span>
				{/if}
				{#if title}
					<h2>{title}</h2>
				{/if}
				{#if description}
					<div class="description">
						{@html description}
					</div>
				{/if}
			</div>

			{#if image?.url}
				<div class="image-content">
					<div class="image-frame">
						<img src={image.url} alt={image.alt || title} />
					</div>
				</div>
			{/if}
		</div>

		{#if values?.length}
			<div class="values-grid">
				{#each values as value}
					<div class="value-card">
						{#if value.icon}
							<div class="value-icon">
								{@html value.icon}
							</div>
						{/if}
						<h3>{value.value_title}</h3>
						<p>{value.value_description}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.mission {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background, #ffffff);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.content-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	align-items: center;
	margin-bottom: 4rem;
}

.text-content {
	max-width: 550px;
}

.badge {
	display: inline-block;
	background: rgba(232, 93, 4, 0.1);
	color: var(--theme-primary, #e85d04);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

h2 {
	font-size: clamp(2rem, 4vw, 2.75rem);
	font-weight: 700;
	color: var(--theme-text, #1e293b);
	margin: 0 0 1.5rem;
	line-height: 1.2;
}

.description {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.8;
}

.description :global(p) {
	margin: 0 0 1rem;
}

.description :global(p:last-child) {
	margin-bottom: 0;
}

.image-content {
	position: relative;
}

.image-frame {
	position: relative;
	border-radius: 16px;
	overflow: hidden;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.image-frame::before {
	content: '';
	position: absolute;
	inset: -10px;
	background: linear-gradient(135deg, var(--theme-primary, #e85d04) 0%, #f97316 100%);
	border-radius: 20px;
	z-index: -1;
	opacity: 0.3;
}

.image-frame img {
	width: 100%;
	height: auto;
	display: block;
}

.values-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
	margin-top: 2rem;
}

.value-card {
	text-align: center;
	padding: 2rem;
	background: var(--theme-background-secondary, #f8fafc);
	border-radius: 16px;
	border: 1px solid var(--theme-border-color, #e2e8f0);
	transition: all 0.3s ease;
}

.value-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
}

.value-icon {
	width: 60px;
	height: 60px;
	background: linear-gradient(135deg, var(--theme-primary, #e85d04) 0%, #f97316 100%);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 1.25rem;
	color: white;
}

.value-icon :global(svg) {
	width: 28px;
	height: 28px;
}

.value-card h3 {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-text, #1e293b);
	margin: 0 0 0.75rem;
}

.value-card p {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.6;
	margin: 0;
}

@media (max-width: 968px) {
	.content-grid {
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}

	.text-content {
		max-width: none;
		text-align: center;
	}

	.image-content {
		max-width: 500px;
		margin: 0 auto;
	}

	.values-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 640px) {
	.values-grid {
		grid-template-columns: 1fr;
	}
}
</style>
