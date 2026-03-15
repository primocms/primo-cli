<section class="services">
  <div class="pala-block-container">
    <div class="section-header">
      {#if title}
        <h2 class="section-title">{title}</h2>
      {/if}
      {#if subtitle}
        <p class="section-subtitle">{subtitle}</p>
      {/if}
    </div>
    {#if items?.length}
      <div class="services-grid">
        {#each items as item}
          <div class="service-card">
            {#if item.icon}
              <div class="service-icon">
                {@html item.icon}
              </div>
            {/if}
            {#if item.service_title}
              <h3>{item.service_title}</h3>
            {/if}
            {#if item.description}
              <p>{item.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
.services {
  padding: var(--theme-section-padding, 6rem) 0;
  background: var(--theme-background, white);
}

.section-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem;
}

.section-title {
  font-family: var(--theme-heading-font, system-ui);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  margin-bottom: 1rem;
  color: var(--theme-text, #0f172a);
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 1.125rem;
  color: var(--theme-text-muted, #64748b);
  line-height: 1.7;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
}

.service-card {
  position: relative;
  background: linear-gradient(145deg, #fafafa 0%, #f1f5f9 100%);
  padding: 2.5rem;
  border-radius: 20px;
  border: 1px solid var(--theme-border-color, #e2e8f0);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.service-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--theme-primary, #667eea) 0%, var(--theme-secondary, #764ba2) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 0;
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px -12px rgba(102, 126, 234, 0.25);
  border-color: transparent;
}

.service-card:hover::before {
  opacity: 1;
}

.service-card > * {
  position: relative;
  z-index: 1;
}

.service-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1.5rem;
  color: var(--theme-primary, #6366f1);
  transition: color 0.4s ease;
}

.service-icon :global(svg) {
  width: 100%;
  height: 100%;
}

.service-card:hover .service-icon {
  color: white;
}

.service-card h3 {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 0.875rem;
  color: var(--theme-text, #1e293b);
  transition: color 0.4s ease;
}

.service-card:hover h3 {
  color: white;
}

.service-card p {
  color: var(--theme-text-muted, #64748b);
  line-height: 1.75;
  font-size: 1rem;
  transition: color 0.4s ease;
}

.service-card:hover p {
  color: white;
}

@media (max-width: 768px) {
  .services {
    padding: 4rem 0;
  }

  .section-header {
    margin-bottom: 2.5rem;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>
