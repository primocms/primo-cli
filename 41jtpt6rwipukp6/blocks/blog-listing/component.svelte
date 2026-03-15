<section class="blog-listing">
  <div class="pala-block-container">
    {#if posts?.length}
      <div class="posts-grid">
        {#each posts as post}
          <a href={post._meta?.url || post.canonical_url || '#'} class="post-card">
            {#if post.featured_image?.url}
              <div class="post-image">
                <img src={post.featured_image.url} alt={post.featured_image.alt || post.title} />
              </div>
            {/if}
            <div class="post-content">
              <div class="post-meta">
                {#if post.author}
                  <span class="post-author">{post.author}</span>
                {/if}
                {#if post.publish_date}
                  <span class="post-date">{post.publish_date}</span>
                {/if}
              </div>
              <h3>{post.title || post._meta?.name || 'Untitled'}</h3>
              {#if post.excerpt}
                <p>{post.excerpt}</p>
              {/if}
              <span class="read-more">Read article</span>
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <div class="no-posts">
        <p>No blog posts found.</p>
      </div>
    {/if}
  </div>
</section>

<style>
.blog-listing {
  padding: 4rem 0 6rem;
  background: white;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.post-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}

.post-image {
  height: 200px;
  overflow: hidden;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.post-card:hover .post-image img {
  transform: scale(1.05);
}

.post-content {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.8125rem;
}

.post-author {
  color: #6366f1;
  font-weight: 600;
}

.post-date {
  color: #94a3b8;
}

.post-content h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.75rem;
  line-height: 1.3;
}

.post-content p {
  font-size: 0.9375rem;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  flex: 1;
}

.read-more {
  display: inline-flex;
  align-items: center;
  margin-top: 1rem;
  color: #6366f1;
  font-weight: 600;
  font-size: 0.875rem;
}

.post-card:hover .read-more {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .posts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .blog-listing {
    padding: 2rem 0 4rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}

.no-posts {
  text-align: center;
  padding: 3rem 0;
  color: #64748b;
}
</style>
