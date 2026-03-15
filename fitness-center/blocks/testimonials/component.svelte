<section class="testimonials-section" id="testimonials">
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
							<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.003zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.817-.56-.124-1.074-.13-1.54-.022-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.49 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.165 1.4.615 2.52 1.35 3.35.732.833 1.646 1.25 2.742 1.25.967 0 1.768-.29 2.402-.876.627-.576.942-1.365.942-2.368v.012z"/></svg>
						</div>
						<blockquote>{testimonial.quote}</blockquote>
						<div class="author">
							{#if testimonial.photo?.url}
								<img src={testimonial.photo.url} alt={testimonial.name} class="author-photo" />
							{:else}
								<div class="author-placeholder">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
								</div>
							{/if}
							<div class="author-info">
								<strong>{testimonial.name}</strong>
								{#if testimonial.info}
									<span>{testimonial.info}</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.testimonials-section {
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
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.testimonial-card {
	background: var(--theme-background-secondary, #f8fafc);
	border-radius: 12px;
	padding: 2rem;
	position: relative;
}

.quote-icon {
	color: var(--theme-primary, #ef4444);
	opacity: 0.3;
	margin-bottom: 1rem;
}

blockquote {
	font-size: 1.0625rem;
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

.author-photo {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	object-fit: cover;
}

.author-placeholder {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	background: var(--theme-border-color, #e2e8f0);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--theme-text-muted, #94a3b8);
}

.author-info {
	display: flex;
	flex-direction: column;
}

.author-info strong {
	font-size: 0.9375rem;
	font-weight: 700;
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
