<section class="testimonials">
  <div class="testimonials-bg"></div>
  <div class="pala-block-container">
    {#if title}
      <h2 class="section-title">{title}</h2>
    {/if}
    <div class="pala-prose testimonials-grid" data-key="content">
      {@html content}
    </div>
  </div>
</section>

<style>
.testimonials {
  position: relative;
  padding: 7rem 0;
  overflow: hidden;
}

.testimonials-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  z-index: 0;
}

.testimonials-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 0% 0%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 100%, rgba(99, 102, 241, 0.2) 0%, transparent 50%);
}

.pala-block-container {
  position: relative;
  z-index: 1;
}

.section-title {
  text-align: center;
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  margin-bottom: 4rem;
  color: white;
  letter-spacing: -0.02em;
}

.testimonials-grid {
  :global(ul) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 2rem;
    list-style: none;
    padding: 0;
  }

  :global(li) {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(12px);
    padding: 2.5rem;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    transition: all 0.3s ease;
    color: white;
  }

  :global(li:hover) {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-4px);
  }

  :global(blockquote) {
    position: relative;
    font-size: 1.0625rem;
    line-height: 1.8;
    margin-bottom: 1.75rem;
    font-style: normal;
    padding-left: 1.5rem;
    border-left: 3px solid rgba(139, 92, 246, 0.6);
  }

  :global(blockquote p) {
    margin: 0;
    color: rgba(255, 255, 255, 0.9);
  }

  :global(li > p:last-child) {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  :global(strong) {
    font-weight: 600;
    font-size: 1.0625rem;
    color: white;
  }

  :global(em) {
    font-style: normal;
    font-size: 0.875rem;
    color: rgba(167, 139, 250, 0.9);
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .testimonials {
    padding: 4rem 0;
  }

  .section-title {
    margin-bottom: 2.5rem;
  }

  .testimonials-grid :global(ul) {
    grid-template-columns: 1fr;
  }
}
</style>
