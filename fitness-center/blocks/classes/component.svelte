<section class="classes-section" id="classes">
	<div class="container">
		<div class="header">
			{#if badge}
				<span class="badge">{badge}</span>
			{/if}
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if classes?.length}
			<div class="grid">
				{#each classes as class_item}
					<div class="class-card">
						{#if class_item.image?.url}
							<div class="class-image">
								<img src={class_item.image.url} alt={class_item.class_name} />
								<div class="class-overlay">
									{#if class_item.intensity}
										<span class="intensity intensity-{class_item.intensity}">{class_item.intensity}</span>
									{/if}
								</div>
							</div>
						{/if}
						<div class="class-content">
							<h3>{class_item.class_name}</h3>
							{#if class_item.duration}
								<div class="meta">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
									<span>{class_item.duration}</span>
								</div>
							{/if}
							{#if class_item.description}
								<p>{class_item.description}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.classes-section {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #0f172a);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.header {
	text-align: center;
	max-width: 700px;
	margin: 0 auto 4rem;
}

.badge {
	display: inline-block;
	background: rgba(239, 68, 68, 0.2);
	color: var(--theme-primary, #ef4444);
	padding: 0.5rem 1rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-bottom: 1rem;
}

h2 {
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 900;
	color: white;
	margin: 0 0 1rem;
	text-transform: uppercase;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.7);
	line-height: 1.7;
	margin: 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.class-card {
	background: rgba(255, 255, 255, 0.05);
	border-radius: 12px;
	overflow: hidden;
	transition: all 0.3s ease;
}

.class-card:hover {
	transform: translateY(-8px);
	background: rgba(255, 255, 255, 0.08);
}

.class-image {
	position: relative;
	aspect-ratio: 4/3;
	overflow: hidden;
}

.class-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.class-card:hover .class-image img {
	transform: scale(1.05);
}

.class-overlay {
	position: absolute;
	top: 1rem;
	right: 1rem;
}

.intensity {
	padding: 0.375rem 0.75rem;
	border-radius: 4px;
	font-size: 0.6875rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.intensity-beginner {
	background: #22c55e;
	color: white;
}

.intensity-intermediate {
	background: #eab308;
	color: black;
}

.intensity-advanced {
	background: var(--theme-primary, #ef4444);
	color: white;
}

.class-content {
	padding: 1.5rem;
}

.class-content h3 {
	font-size: 1.25rem;
	font-weight: 800;
	color: white;
	margin: 0 0 0.75rem;
	text-transform: uppercase;
}

.meta {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: rgba(255, 255, 255, 0.6);
	font-size: 0.875rem;
	margin-bottom: 0.75rem;
}

.meta svg {
	color: var(--theme-primary, #ef4444);
}

.class-content p {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.6;
	margin: 0;
}

@media (max-width: 968px) {
	.grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 640px) {
	.grid {
		grid-template-columns: 1fr;
	}
}
</style>
