<section class="offices">
  <div class="pala-block-container">
    <div class="offices-header">
      {#if title}
        <h2>{title}</h2>
      {/if}
      {#if subtitle}
        <p>{subtitle}</p>
      {/if}
    </div>
    {#if locations?.length}
      <div class="offices-grid">
        {#each locations as location}
          <div class="office-card">
            {#if location.image?.url}
              <div class="office-image">
                <img src={location.image.url} alt={location.city || location.image.alt || 'Office location'} />
              </div>
            {/if}
            <div class="office-info">
              {#if location.city}
                <h3>{location.city}</h3>
              {/if}
              {#if location.badge}
                <span class="office-badge">{location.badge}</span>
              {/if}
              {#if location.address}
                <p>{location.address}</p>
              {/if}
              {#if location.phone}
                <a href="tel:{location.phone.replace(/[^0-9+]/g, '')}" class="office-phone">{location.phone}</a>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
.offices {
  padding: var(--theme-section-padding, 7rem) 0;
  background: var(--theme-background, white);
}

.offices-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 4rem;

  h2 {
    font-family: var(--theme-heading-font, system-ui);
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    margin-bottom: 1rem;
    color: var(--theme-text, #0f172a);
    letter-spacing: -0.02em;
  }

  p {
    font-size: 1.125rem;
    color: var(--theme-text-muted, #64748b);
    line-height: 1.7;
  }
}

.offices-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.office-card {
  background: var(--theme-background-secondary, #f8fafc);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--theme-border-color, #e2e8f0);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }
}

.office-image {
  height: 180px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
}

.office-card:hover .office-image img {
  transform: scale(1.05);
}

.office-info {
  padding: 1.5rem;

  h3 {
    font-size: 1.375rem;
    font-weight: 700;
    color: var(--theme-text, #0f172a);
    margin-bottom: 0.5rem;
  }

  p {
    color: var(--theme-text-muted, #64748b);
    font-size: 0.9375rem;
    margin: 0.25rem 0;
    line-height: 1.5;
  }
}

.office-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: linear-gradient(135deg, var(--theme-primary, #6366f1) 0%, var(--theme-secondary, #8b5cf6) 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.office-phone {
  display: inline-block;
  margin-top: 0.75rem;
  color: var(--theme-primary, #6366f1);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9375rem;
  transition: color 0.2s;

  &:hover {
    color: var(--theme-primary-dark, #4f46e5);
  }
}

@media (max-width: 1024px) {
  .offices-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .offices {
    padding: 4rem 0;
  }

  .offices-grid {
    grid-template-columns: 1fr;
  }
}
</style>
