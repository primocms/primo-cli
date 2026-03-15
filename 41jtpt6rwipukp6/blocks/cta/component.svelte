<section class="cta-section">
  <div class="cta-bg"></div>
  <div class="pala-block-container">
    <div class="cta-content">
      <h2>{title}</h2>
      {#if subtitle}
        <p class="subtitle">{subtitle}</p>
      {/if}
      {#if button?.url}
        <a href={button.url} class="cta-button">
          {button.label}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      {/if}
    </div>
  </div>
</section>

<style>
.cta-section {
  position: relative;
  padding: 6rem 0;
  overflow: hidden;
}

.cta-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  z-index: 0;
}

.cta-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%);
}

.pala-block-container {
  position: relative;
  z-index: 1;
}

.cta-content {
  text-align: center;
  max-width: 700px;
  margin: 0 auto;
}

h2 {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 1rem;
  color: white;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2.5rem;
  line-height: 1.7;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
}

.cta-button {
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

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
}

.cta-button svg {
  transition: transform 0.3s ease;
}

.cta-button:hover svg {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .cta-section {
    padding: 4rem 0;
  }

  .subtitle {
    margin-bottom: 2rem;
  }
}
</style>
