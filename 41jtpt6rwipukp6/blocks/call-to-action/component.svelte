<section class="cta-section">
  <div class="pala-block-container">
    <h2>{title}</h2>
    {#if subtitle}
      <p class="subtitle">{subtitle}</p>
    {/if}
    {#if button?.url}
      <a href={button.url} class="cta-button">{button.label}</a>
    {/if}
  </div>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pala-css@latest/reset.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pala-css@latest/components.css">

<style>
.cta-section {
  background: #1e293b;
  color: white;
  padding: 5rem 0;
  text-align: center;
}

h2 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.125rem;
  opacity: 0.8;
  margin-bottom: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.cta-button {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .cta-section {
    padding: 3rem 0;
  }

  h2 {
    font-size: 1.5rem;
  }
}
</style>