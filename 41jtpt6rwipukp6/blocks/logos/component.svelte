<section class="logos">
  <div class="pala-block-container">
    {#if title}
      <p class="logos-title">{title}</p>
    {/if}
    {#if logos?.length}
      <div class="logos-grid">
        {#each logos as logo}
          <div class="logo-item">
            {#if logo.image?.url}
              <img src={logo.image.url} alt={logo.alt || logo.image.alt || 'Client logo'} />
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
.logos {
  padding: var(--theme-section-padding, 4rem) 0;
  background: var(--theme-background-secondary, #f8fafc);
  border-bottom: 1px solid var(--theme-border-color, #e2e8f0);
}

.logos-title {
  text-align: center;
  font-size: 0.9375rem;
  color: var(--theme-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 500;
  margin-bottom: 2.5rem;
}

.logos-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 3rem 4rem;
}

.logo-item {
  opacity: 0.5;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-item:hover {
  opacity: 1;
}

.logo-item img {
  height: 48px;
  width: auto;
  max-width: 160px;
  object-fit: contain;
  filter: grayscale(100%);
  transition: filter 0.3s ease;
}

.logo-item:hover img {
  filter: grayscale(0%);
}

@media (max-width: 768px) {
  .logos {
    padding: 3rem 0;
  }

  .logos-grid {
    gap: 2rem 3rem;
  }

  .logo-item img {
    height: 36px;
    max-width: 120px;
  }
}
</style>
