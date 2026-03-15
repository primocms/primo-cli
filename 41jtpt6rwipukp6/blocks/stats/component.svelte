<section class="stats">
  <div class="stats-bg">
    {#if background_image?.url}
      <img
        src={background_image.url}
        alt={background_image.alt || ''}
        class="stats-image"
      />
    {:else}
      <img
        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80&auto=format&fit=crop"
        alt=""
        class="stats-image"
      />
    {/if}
    <div class="stats-overlay"></div>
  </div>
  <div class="pala-block-container">
    <div class="stats-header">
      {#if title}
        <h2>{title}</h2>
      {/if}
      {#if subtitle}
        <p>{subtitle}</p>
      {/if}
    </div>
    {#if stats?.length}
      <div class="stats-grid" style="grid-template-columns: repeat({stats.length}, 1fr);">
        {#each stats as stat}
          <div class="stat-item">
            <span class="stat-number">{stat.value}</span>
            <span class="stat-label">{stat.label}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
.stats {
  position: relative;
  padding: var(--theme-section-padding, 7rem) 0;
  overflow: hidden;
}

.stats-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.stats-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stats-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.92) 100%
  );
}

.pala-block-container {
  position: relative;
  z-index: 1;
}

.stats-header {
  text-align: center;
  margin-bottom: 4rem;
  color: white;

  h2 {
    font-family: var(--theme-heading-font, system-ui);
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    margin-bottom: 0.75rem;
    letter-spacing: -0.02em;
  }

  p {
    font-size: 1.125rem;
    opacity: 0.8;
  }
}

.stats-grid {
  display: grid;
  gap: 2rem;
}

.stat-item {
  text-align: center;
  color: white;
}

.stat-number {
  display: block;
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--theme-accent-light, #a5b4fc) 0%, var(--theme-accent, #c4b5fd) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9375rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.7;
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats {
    padding: 4rem 0;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 2.5rem 1.5rem;
  }

  .stats-header {
    margin-bottom: 3rem;
  }
}
</style>
