<section class="page-header">
  <div class="header-bg"></div>
  <div class="pala-block-container">
    <h1>{title}</h1>
    {#if subtitle}
      <p class="subtitle">{subtitle}</p>
    {/if}
  </div>
</section>

<style>
.page-header {
  position: relative;
  padding: 10rem 0 5rem;
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

h1 {
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  font-weight: 800;
  color: white;
  margin: 0 0 1rem;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .page-header {
    padding: 8rem 0 4rem;
  }
}
</style>
