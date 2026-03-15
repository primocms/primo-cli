<section class="testimonials">
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
			<div class="testimonials-grid">
				{#each testimonials as testimonial}
					<blockquote class="testimonial-card">
						<div class="quote-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M11.192 15.757c0-.88-.23-1.618-.69-2.217-.326-.412-.768-.683-1.327-.812-.55-.128-1.07-.137-1.54-.028-.16-.95.1-1.956.76-3.022.66-1.065 1.515-1.867 2.558-2.403L9.373 5c-.8.396-1.56.898-2.26 1.505-.71.607-1.34 1.305-1.9 2.094s-.98 1.68-1.25 2.69-.346 2.04-.217 3.1c.168 1.4.62 2.52 1.356 3.35.735.84 1.652 1.26 2.748 1.26.965 0 1.766-.29 2.4-.878.628-.576.94-1.365.94-2.368l.002.003zm9.124 0c0-.88-.23-1.618-.69-2.217-.326-.42-.77-.692-1.327-.817-.56-.124-1.074-.13-1.54-.022-.16-.94.09-1.95.75-3.02.66-1.06 1.514-1.86 2.557-2.4L18.49 5c-.8.396-1.555.898-2.26 1.505-.708.607-1.34 1.305-1.894 2.094-.556.79-.97 1.68-1.24 2.69-.273 1-.345 2.04-.217 3.1.165 1.4.615 2.52 1.35 3.35.732.833 1.646 1.25 2.742 1.25.967 0 1.768-.29 2.402-.876.627-.576.942-1.365.942-2.368v.01z"/></svg>
						</div>
						<p class="quote">{testimonial.quote}</p>
						<footer class="testimonial-footer">
							{#if testimonial.image?.url}
								<img src={testimonial.image.url} alt={testimonial.author} class="author-image" />
							{/if}
							<div class="author-info">
								<cite class="author-name">{testimonial.author}</cite>
								{#if testimonial.event_type}
									<span class="event-type">{testimonial.event_type}</span>
								{/if}
							</div>
						</footer>
					</blockquote>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.testimonials {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background-secondary, #F5F1E8);
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
	background: var(--theme-primary, #B8860B);
	color: white;
	padding: 0.375rem 1rem;
	border-radius: 50px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-bottom: 1rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 700;
	color: var(--theme-text, #1a1a1a);
	margin: 0;
}

.testimonials-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	gap: 2rem;
}

.testimonial-card {
	background: white;
	padding: 2rem;
	border-radius: 12px;
	box-shadow: 0 4px 20px rgba(0,0,0,0.06);
	margin: 0;
}

.quote-icon {
	color: var(--theme-primary, #B8860B);
	opacity: 0.3;
	margin-bottom: 1rem;
}

.quote {
	font-size: 1.0625rem;
	line-height: 1.7;
	color: var(--theme-text, #1a1a1a);
	margin: 0 0 1.5rem;
	font-style: italic;
}

.testimonial-footer {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.author-image {
	width: 48px;
	height: 48px;
	border-radius: 50%;
	object-fit: cover;
}

.author-info {
	display: flex;
	flex-direction: column;
}

.author-name {
	font-style: normal;
	font-weight: 600;
	color: var(--theme-text, #1a1a1a);
}

.event-type {
	font-size: 0.875rem;
	color: var(--theme-text-muted, #666666);
}

@media (max-width: 640px) {
	.testimonials-grid {
		grid-template-columns: 1fr;
	}
}
</style>
