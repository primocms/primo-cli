<section class="testimonials" id="testimonials">
	<div class="container">
		<div class="header">
			{#if badge}
				<span class="badge">{badge}</span>
			{/if}
			{#if title}
				<h2>{title}</h2>
			{/if}
		</div>

		{#if testimonials?.length}
			<div class="grid">
				{#each testimonials as testimonial}
					<div class="testimonial-card">
						<div class="stars">
							{#each Array(5) as _}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
							{/each}
						</div>
						<blockquote>"{testimonial.quote}"</blockquote>
						<div class="author">
							{#if testimonial.avatar?.url}
								<img src={testimonial.avatar.url} alt={testimonial.name} class="avatar" />
							{:else}
								<div class="avatar-placeholder">
									{testimonial.name?.charAt(0) || 'A'}
								</div>
							{/if}
							<div class="author-info">
								<strong>{testimonial.name}</strong>
								<span>{testimonial.role}{#if testimonial.company}, {testimonial.company}{/if}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.testimonials {
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
	margin-bottom: 4rem;
}

.badge {
	display: inline-block;
	background: rgba(99, 102, 241, 0.1);
	color: var(--theme-primary, #6366f1);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
}

h2 {
	font-size: clamp(2rem, 4vw, 2.75rem);
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	margin: 0;
	letter-spacing: -0.02em;
}

.grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.testimonial-card {
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 2rem;
}

.stars {
	display: flex;
	gap: 0.25rem;
	color: #fbbf24;
	margin-bottom: 1.5rem;
}

blockquote {
	font-size: 1rem;
	color: var(--theme-text, #0f172a);
	line-height: 1.7;
	margin: 0 0 1.5rem;
	font-style: normal;
}

.author {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.avatar {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	object-fit: cover;
}

.avatar-placeholder {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 1.25rem;
}

.author-info {
	display: flex;
	flex-direction: column;
}

.author-info strong {
	color: var(--theme-text, #0f172a);
	font-size: 0.9375rem;
}

.author-info span {
	color: var(--theme-text-muted, #64748b);
	font-size: 0.875rem;
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