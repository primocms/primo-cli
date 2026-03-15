<article class="case-study-card">
  <div class="case-study-meta">
    {#if industry}
      <span class="industry">{industry}</span>
    {/if}
    {#if service}
      <span class="service">{service}</span>
    {/if}
  </div>
  {#if title}
    <h3>{title}</h3>
  {/if}
  {#if description}
    <p>{description}</p>
  {/if}
  {#if results?.length}
    <div class="case-study-results">
      {#each results as result}
        <div class="result">
          <strong>{result.value}</strong>
          <span>{result.label}</span>
        </div>
      {/each}
    </div>
  {/if}
</article>

<style>
.case-study-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #e2e8f0;
}

.case-study-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.case-study-meta span {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
}

.case-study-meta .industry {
  background: #e0e7ff;
  color: #4338ca;
}

.case-study-meta .service {
  background: #fef3c7;
  color: #92400e;
}

.case-study-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: #0f172a;
}

.case-study-card > p {
  color: #64748b;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.case-study-results {
  display: flex;
  gap: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.case-study-results .result {
  text-align: center;
}

.case-study-results .result strong {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #6366f1;
}

.case-study-results .result span {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (max-width: 640px) {
  .case-study-results {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .case-study-results .result {
    flex: 1;
    min-width: 80px;
  }
}
</style>
