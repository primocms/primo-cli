<section class="features">
  <div class="pala-block-container">
    {#if title}
      <h2 class="section-title">{title}</h2>
    {/if}
    {#if features?.length}
      <div class="features-grid">
        {#each features as feature}
          <div class="feature-card">
            {#if feature.icon}
              <div class="feature-icon">{@html feature.icon}</div>
            {/if}
            {#if feature.feature_title}
              <h3>{feature.feature_title}</h3>
            {/if}
            {#if feature.description}
              <p>{feature.description}</p>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pala-css@latest/reset.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pala-css@latest/components.css">

<style>
.features {
  padding: var(--theme-section-padding, 5rem) 0;
  background: var(--theme-background-secondary, #f8fafc);
}

.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: var(--theme-text, #1e293b);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--theme-primary, #6366f1);
}

.feature-icon :global(svg) {
  width: 2.5rem;
  height: 2.5rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--theme-text, #334155);
}

.feature-card p {
  color: var(--theme-text-muted, #64748b);
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .features {
    padding: 3rem 0;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>