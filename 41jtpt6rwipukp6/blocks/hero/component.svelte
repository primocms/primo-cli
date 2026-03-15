<section class="hero">
  <div class="hero-bg">
    <img
      src={background_image?.url || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80&auto=format&fit=crop"}
      alt={background_image?.alt || ""}
      class="hero-bg-image"
    />
    <div class="hero-overlay"></div>
  </div>
  <div class="pala-block-container">
    <div class="hero-content">
      <h1>{headline}</h1>
      <p class="hero-subtext">{subtext}</p>
      {#if cta?.url}
        <a href={cta.url} class="hero-cta">
          {cta.label}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      {/if}
    </div>
  </div>
</section>

<style>
.hero {
  position: relative;
  padding: 10rem 0 8rem;
  overflow: hidden;
  min-height: 80vh;
  display: flex;
  align-items: center;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-bg-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(49, 46, 129, 0.75) 100%);
}

.hero-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
}

.pala-block-container {
  position: relative;
  z-index: 1;
}

.hero-content {
  max-width: 800px;
  text-align: center;
  margin: 0 auto;
}

h1 {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 800;
  color: white;
  margin: 0 0 1.5rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-subtext {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  margin: 0 0 2.5rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  padding: 1.125rem 2.25rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.0625rem;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.hero-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
}

.hero-cta svg {
  transition: transform 0.3s ease;
}

.hero-cta:hover svg {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .hero {
    padding: 8rem 0 6rem;
    min-height: 70vh;
  }

  .hero-subtext {
    font-size: 1.125rem;
  }
}
</style>
