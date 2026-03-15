<section class="featured-posts">
	<div class="container">
		<div class="section-header">
			{#if section_label}
				<span class="section-label">{section_label}</span>
			{/if}
			{#if section_title}
				<h2>{section_title}</h2>
			{/if}
			{#if section_description}
				<p class="section-description">{section_description}</p>
			{/if}
		</div>

		{#if posts?.length}
			<div class="posts-grid">
				{#each posts as post, index}
					<article class="post-card" class:featured={index === 0}>
						{#if post.image?.url}
							<div class="post-image">
								<img src={post.image.url} alt={post.title || 'Post image'} />
							</div>
						{/if}
						<div class="post-content">
							{#if post.category}
								<span class="post-category">{post.category}</span>
							{/if}
							{#if post.title}
								<h3>
									{#if post.link?.url}
										<a href={post.link.url}>{post.title}</a>
									{:else}
										{post.title}
									{/if}
								</h3>
							{/if}
							{#if post.excerpt}
								<p class="post-excerpt">{post.excerpt}</p>
							{/if}
							<div class="post-meta">
								{#if post.date}
									<span class="post-date">{post.date}</span>
								{/if}
								{#if post.read_time}
									<span class="post-read-time">{post.read_time}</span>
								{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}

		{#if view_all_link?.url}
			<div class="view-all">
				<a href={view_all_link.url} class="view-all-link">
					{view_all_link.label || 'View all posts'}
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
				</a>
			</div>
		{/if}
	</div>
</section>

<style>
.featured-posts {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background-secondary, #f8fafc);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.section-header {
	text-align: center;
	margin-bottom: 3rem;
}

.section-label {
	display: inline-block;
	color: var(--theme-primary, #6366f1);
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-bottom: 0.5rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Georgia', serif);
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 700;
	color: var(--theme-text, #1a1a2e);
	margin: 0 0 1rem;
}

.section-description {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	max-width: 600px;
	margin: 0 auto;
}

.posts-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 2rem;
}

.post-card {
	background: var(--theme-background, #ffffff);
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-card:hover {
	transform: translateY(-4px);
	box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
}

.post-card.featured {
	grid-column: span 2;
	grid-row: span 2;
}

.post-image {
	position: relative;
	padding-top: 60%;
	overflow: hidden;
}

.post-card.featured .post-image {
	padding-top: 50%;
}

.post-image img {
	position: absolute;
	top: 0;
	left: 0;
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

.post-card.featured .post-content {
	padding: 2rem;
}

.post-category {
	display: inline-block;
	color: var(--theme-primary, #6366f1);
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin-bottom: 0.75rem;
}

h3 {
	font-family: var(--theme-heading-font, 'Georgia', serif);
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-text, #1a1a2e);
	margin: 0 0 0.75rem;
	line-height: 1.4;
}

.post-card.featured h3 {
	font-size: 1.75rem;
}

h3 a {
	color: inherit;
	text-decoration: none;
	transition: color 0.2s ease;
}

h3 a:hover {
	color: var(--theme-primary, #6366f1);
}

.post-excerpt {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.6;
	margin: 0 0 1rem;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.post-card.featured .post-excerpt {
	-webkit-line-clamp: 4;
}

.post-meta {
	display: flex;
	gap: 1rem;
	font-size: 0.875rem;
	color: var(--theme-text-muted, #94a3b8);
}

.post-meta span {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.view-all {
	text-align: center;
	margin-top: 3rem;
}

.view-all-link {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--theme-primary, #6366f1);
	font-weight: 600;
	text-decoration: none;
	transition: gap 0.2s ease;
}

.view-all-link:hover {
	gap: 0.75rem;
}

@media (max-width: 968px) {
	.posts-grid {
		grid-template-columns: repeat(2, 1fr);
	}

	.post-card.featured {
		grid-column: span 2;
		grid-row: span 1;
	}
}

@media (max-width: 640px) {
	.posts-grid {
		grid-template-columns: 1fr;
	}

	.post-card.featured {
		grid-column: span 1;
	}
}
</style>
