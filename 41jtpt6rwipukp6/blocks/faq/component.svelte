<script>
  let open_index = $state(null)

  function toggle(index) {
    open_index = open_index === index ? null : index
  }
</script>

<section class="faq">
  <div class="pala-block-container">
    {#if title || subtitle}
      <div class="faq-header">
        {#if title}
          <h2>{title}</h2>
        {/if}
        {#if subtitle}
          <p>{subtitle}</p>
        {/if}
      </div>
    {/if}

    {#if items?.length}
      <div class="faq-list">
        {#each items as item, i}
          <div class="faq-item" class:is-open={open_index === i}>
            <button class="faq-question" onclick={() => toggle(i)}>
              <span>{item.question}</span>
              <svg class="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <div class="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
.faq {
  padding: 6rem 0;
  background: white;
}

.faq-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 4rem;
}

.faq-header h2 {
  font-family: var(--theme-heading-font, system-ui);
  font-size: 2.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.faq-header p {
  font-size: 1.125rem;
  color: #64748b;
  line-height: 1.7;
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  border-bottom: 1px solid #e2e8f0;
}

.faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
}

.faq-question span {
  font-family: var(--theme-heading-font, system-ui);
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
}

.faq-icon {
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.3s ease;
}

.faq-item.is-open .faq-icon {
  transform: rotate(180deg);
  color: #6366f1;
}

.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
}

.faq-item.is-open .faq-answer {
  max-height: 500px;
  padding-bottom: 1.5rem;
}

.faq-answer p {
  font-size: 1rem;
  color: #64748b;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .faq {
    padding: 4rem 0;
  }

  .faq-header h2 {
    font-size: 2rem;
  }

  .faq-question span {
    font-size: 1rem;
  }
}
</style>
