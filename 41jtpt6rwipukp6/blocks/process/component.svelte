<section class="process">
  <div class="pala-block-container">
    {#if title || subtitle}
      <div class="process-header">
        {#if title}
          <h2>{title}</h2>
        {/if}
        {#if subtitle}
          <p>{subtitle}</p>
        {/if}
      </div>
    {/if}

    {#if steps?.length}
      <div class="process-steps">
        {#each steps as step, i}
          <div class="process-step">
            <div class="step-number">{i + 1}</div>
            {#if step.icon}
              <div class="step-icon">{@html step.icon}</div>
            {/if}
            {#if step.step_title}
              <h3>{step.step_title}</h3>
            {/if}
            {#if step.description}
              <p>{step.description}</p>
            {/if}
            {#if i < steps.length - 1}
              <svg class="step-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
.process {
  padding: var(--theme-section-padding, 6rem) 0;
  background: var(--theme-background-secondary, #f8fafc);
}

.process-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 4rem;
}

.process-header h2 {
  font-family: var(--theme-heading-font, system-ui);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--theme-text, #0f172a);
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.process-header p {
  font-size: 1.125rem;
  color: var(--theme-text-muted, #64748b);
  line-height: 1.7;
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  position: relative;
}

.process-step {
  position: relative;
  text-align: center;
  padding: 2rem 1.5rem;
  background: var(--theme-background, white);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--theme-border-color, #e2e8f0);
}

.step-number {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--theme-primary, #6366f1), var(--theme-secondary, #8b5cf6));
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
}

.step-icon {
  width: 48px;
  height: 48px;
  margin: 1rem auto;
  color: var(--theme-primary, #6366f1);
}

.step-icon :global(svg) {
  width: 100%;
  height: 100%;
}

.process-step h3 {
  font-family: var(--theme-heading-font, system-ui);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--theme-text, #0f172a);
  margin-bottom: 0.75rem;
}

.process-step p {
  font-size: 0.9375rem;
  color: var(--theme-text-muted, #64748b);
  line-height: 1.6;
}

.step-arrow {
  display: none;
}

@media (min-width: 1024px) {
  .step-arrow {
    display: block;
    position: absolute;
    top: 50%;
    right: -2rem;
    width: 32px;
    height: 32px;
    color: var(--theme-primary, #6366f1);
    transform: translateY(-50%);
    opacity: 0.4;
  }
}

@media (max-width: 1024px) {
  .process-steps {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .process {
    padding: 4rem 0;
  }

  .process-header h2 {
    font-size: 2rem;
  }

  .process-steps {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>
