<section class="trainers-section" id="trainers">
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

		{#if trainers?.length}
			<div class="grid">
				{#each trainers as trainer}
					<div class="trainer-card">
						<div class="trainer-image">
							{#if trainer.photo?.url}
								<img src={trainer.photo.url} alt={trainer.name} />
							{:else}
								<div class="placeholder">
									<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
								</div>
							{/if}
							{#if trainer.instagram}
								<a href={trainer.instagram} class="social-link" target="_blank" rel="noopener" aria-label="Instagram">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
								</a>
							{/if}
						</div>
						<div class="trainer-content">
							<h3>{trainer.name}</h3>
							{#if trainer.role}
								<span class="role">{trainer.role}</span>
							{/if}
							{#if trainer.bio}
								<p>{trainer.bio}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.trainers-section {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background, #ffffff);
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
	background: rgba(239, 68, 68, 0.1);
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
	color: var(--theme-text, #0f172a);
	margin: 0 0 1rem;
	text-transform: uppercase;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 2rem;
}

.trainer-card {
	text-align: center;
}

.trainer-image {
	position: relative;
	aspect-ratio: 1;
	border-radius: 50%;
	overflow: hidden;
	margin-bottom: 1.5rem;
}

.trainer-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.trainer-card:hover .trainer-image img {
	transform: scale(1.05);
}

.placeholder {
	width: 100%;
	height: 100%;
	background: var(--theme-background-secondary, #f1f5f9);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--theme-text-muted, #94a3b8);
}

.social-link {
	position: absolute;
	bottom: 10%;
	right: 10%;
	width: 40px;
	height: 40px;
	background: var(--theme-primary, #ef4444);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	opacity: 0;
	transform: scale(0.8);
	transition: all 0.3s ease;
}

.trainer-card:hover .social-link {
	opacity: 1;
	transform: scale(1);
}

.social-link:hover {
	background: var(--theme-primary-dark, #dc2626);
}

.trainer-content h3 {
	font-size: 1.25rem;
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.25rem;
	text-transform: uppercase;
}

.role {
	display: block;
	font-size: 0.875rem;
	color: var(--theme-primary, #ef4444);
	font-weight: 600;
	margin-bottom: 0.75rem;
}

.trainer-content p {
	font-size: 0.875rem;
	color: var(--theme-text-muted, #64748b);
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
		max-width: 300px;
		margin: 0 auto;
	}
}
</style>
