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
			<div class="testimonials-grid">
				{#each testimonials as testimonial}
					<div class="testimonial-card">
						{#if testimonial.rating}
							<div class="stars">
								{#each Array(5) as _, i}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill={i < testimonial.rating ? "currentColor" : "none"}
										stroke="currentColor"
										stroke-width="2"
									>
										<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
									</svg>
								{/each}
							</div>
						{/if}

						<blockquote>"{testimonial.quote}"</blockquote>

						<div class="author">
							{#if testimonial.avatar?.url}
								<img src={testimonial.avatar.url} alt={testimonial.author} class="avatar" />
							{:else}
								<div class="avatar-placeholder">
									{testimonial.author?.charAt(0) || '?'}
								</div>
							{/if}
							<div class="author-info">
								<span class="author-name">{testimonial.author}</span>
								{#if testimonial.role}
									<span class="author-role">{testimonial.role}</span>
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
.testimonials {
	padding: var(--theme-section-padding, 6rem) 0;
	background: white;
}

.container {
	max-width: 1280px;
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
	background: rgba(14, 165, 233, 0.1);
	color: var(--theme-primary, #0ea5e9);
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

.testimonials-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.testimonial-card {
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 16px;
	padding: 2rem;
	display: flex;
	flex-direction: column;
}

.stars {
	display: flex;
	gap: 0.25rem;
	color: #fbbf24;
	margin-bottom: 1.25rem;
}

blockquote {
	font-size: 1.0625rem;
	color: var(--theme-text, #0f172a);
	line-height: 1.7;
	margin: 0 0 1.5rem;
	flex: 1;
}

.author {
	display: flex;
	align-items: center;
	gap: 0.75rem;
}

.avatar,
.avatar-placeholder {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	flex-shrink: 0;
}

.avatar {
	object-fit: cover;
}

.avatar-placeholder {
	background: linear-gradient(135deg, var(--theme-primary, #0ea5e9) 0%, #6366f1 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 1.125rem;
}

.author-info {
	display: flex;
	flex-direction: column;
}

.author-name {
	font-weight: 600;
	color: var(--theme-text, #0f172a);
	font-size: 0.9375rem;
}

.author-role {
	font-size: 0.8125rem;
	color: var(--theme-text-muted, #64748b);
}

@media (max-width: 968px) {
	.testimonials-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 640px) {
	.testimonials-grid {
		grid-template-columns: 1fr;
	}
}
</style>
