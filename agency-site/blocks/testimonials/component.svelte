<section class="testimonials" id="testimonials">
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

		{#if testimonials?.length}
			<div class="grid">
				{#each testimonials as testimonial}
					<div class="testimonial-card">
						<div class="quote-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.003zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.768-.695-1.327-.825-.55-.13-1.07-.14-1.54-.03-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.49 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l-.007.003z"/></svg>
						</div>
						<blockquote>{testimonial.quote}</blockquote>
						<div class="author">
							{#if testimonial.avatar?.url}
								<img src={testimonial.avatar.url} alt={testimonial.avatar.alt || testimonial.author} class="avatar" />
							{:else}
								<div class="avatar-placeholder">
									{testimonial.author?.charAt(0) || 'A'}
								</div>
							{/if}
							<div class="author-info">
								<strong>{testimonial.author}</strong>
								<span>{testimonial.role}{testimonial.company ? `, ${testimonial.company}` : ''}</span>
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
	max-width: 700px;
	margin: 0 auto 4rem;
}

.badge {
	display: inline-block;
	background: rgba(249, 115, 22, 0.1);
	color: var(--theme-primary, #f97316);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

h2 {
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	margin: 0 0 1rem;
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
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.testimonial-card {
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 2rem;
	transition: all 0.3s ease;
}

.testimonial-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
}

.quote-icon {
	color: var(--theme-primary, #f97316);
	opacity: 0.3;
	margin-bottom: 1rem;
}

blockquote {
	font-size: 1rem;
	color: var(--theme-text, #0f172a);
	line-height: 1.7;
	margin: 0 0 1.5rem;
	font-style: italic;
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
	background: var(--theme-primary, #f97316);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 1.25rem;
}

.author-info {
	display: flex;
	flex-direction: column;
}

.author-info strong {
	font-size: 0.9375rem;
	color: var(--theme-text, #0f172a);
}

.author-info span {
	font-size: 0.8125rem;
	color: var(--theme-text-muted, #64748b);
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
