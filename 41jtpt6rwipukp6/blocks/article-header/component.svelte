<article class="article-header">
  <div class="header-bg"></div>
  <div class="pala-block-container">
    <div class="article-meta">
      {#if author}
        <span class="author">{author}</span>
      {/if}
      {#if date}
        <span class="date">{date}</span>
      {/if}
    </div>
    <h1>{title}</h1>
    {#if excerpt}
      <p class="excerpt">{excerpt}</p>
    {/if}
  </div>
  {#if image?.url}
    <div class="featured-image">
      <img src={image.url} alt={image.alt || title} />
    </div>
  {/if}
</article>

<style>
.article-header {
  position: relative;
  padding: 10rem 0 3rem;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%);
  z-index: 0;
}

.header-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 40%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
}

.pala-block-container {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.author {
  font-size: 0.875rem;
  font-weight: 600;
  color: #a5b4fc;
}

.date {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
}

h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: white;
  margin: 0 0 1.5rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.excerpt {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto 2rem;
}

.featured-image {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 3rem auto 0;
  padding: 0 2rem;
}

.featured-image img {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .article-header {
    padding: 8rem 0 2rem;
  }

  .featured-image {
    padding: 0 1rem;
  }
}
</style>
