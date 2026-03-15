<section class="blog-listing">
	<div class="container">
		{#if title}
			<h2 class="section-title">{title}</h2>
		{/if}
		{#if posts?.length}
			<div class="grid">
				{#each posts as post}
					<a href={post.canonical_url} class="post-card">
						{#if post.featured_image?.url}
							<div class="post-image">
								<img src={post.featured_image.url} alt={post.featured_image.alt || post.title} />
							</div>
						{/if}
						<div class="post-content">
							{#if post.publish_date}
								<span class="post-date">{post.publish_date}</span>
							{/if}
							<h3>{post.title}</h3>
							{#if post.excerpt}
								<p>{post.excerpt}</p>
							{/if}
							<span class="read-more">
								Read article
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
							</span>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<p class="no-posts">No posts yet. Check back soon!</p>
		{/if}
	</div>
</section>

<style>
.blog-listing {
	padding: var(--theme-section-padding, 4rem) 0;
	background: var(--theme-background, #ffffff);
}

.section-title {
	font-size: 2rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	text-align: center;
	margin-bottom: 2.5rem;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.post-card {
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	overflow: hidden;
	text-decoration: none;
	transition: all 0.3s ease;
}

.post-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
	border-color: var(--theme-primary, #6366f1);
}

.post-image {
	aspect-ratio: 16/10;
	overflow: hidden;
}

.post-image img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.3s ease;
}

.post-card:hover .post-image img {
	transform: scale(1.05);
}

.post-content {
	padding: 1.5rem;
}

.post-date {
	font-size: 0.875rem;
	color: var(--theme-primary, #6366f1);
	font-weight: 500;
}

.post-content h3 {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0.5rem 0 0.75rem;
	line-height: 1.3;
}

.post-content p {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.6;
	margin: 0 0 1rem;
}

.read-more {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.9375rem;
	font-weight: 600;
	color: var(--theme-primary, #6366f1);
}

.read-more svg {
	transition: transform 0.3s ease;
}

.post-card:hover .read-more svg {
	transform: translateX(4px);
}

.no-posts {
	text-align: center;
	color: var(--theme-text-muted, #64748b);
	padding: 3rem 0;
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