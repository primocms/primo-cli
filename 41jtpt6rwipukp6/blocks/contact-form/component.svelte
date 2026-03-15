<script>
let form_state = $state('idle') // 'idle' | 'submitting' | 'success' | 'error'
let form_element = $state(null)

async function handle_submit(event) {
	event.preventDefault()
	if (!endpoint) return

	form_state = 'submitting'
	const form_data = new FormData(event.target)

	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			body: form_data
		})

		if (response.ok) {
			form_state = 'success'
			form_element.reset()
			setTimeout(() => form_state = 'idle', 5000)
		} else {
			form_state = 'error'
			setTimeout(() => form_state = 'idle', 5000)
		}
	} catch (error) {
		form_state = 'error'
		setTimeout(() => form_state = 'idle', 5000)
	}
}
</script>

<section class="contact-form-section">
  <div class="pala-block-container">
    <div class="contact-form-wrapper">
      <div class="contact-form-header">
        {#if title}
          <h2>{title}</h2>
        {/if}
        {#if subtitle}
          <p>{subtitle}</p>
        {/if}
      </div>
      {#if rows?.length}
        <form class="contact-form" onsubmit={handle_submit} bind:this={form_element}>
          {#each rows as row}
            <div class="form-row" style="grid-template-columns: repeat({row.fields?.length || 1}, 1fr);">
              {#each row.fields as field}
                <div class="form-group">
                  <label for={field.name}>{field.label}</label>
                  {#if field.input_type === 'textarea'}
                    <textarea id={field.name} name={field.name} rows="4" required={field.required === 'true'}></textarea>
                  {:else}
                    <input
                      type={field.input_type || 'text'}
                      id={field.name}
                      name={field.name}
                      required={field.required === 'true'}
                    />
                  {/if}
                </div>
              {/each}
            </div>
          {/each}
          <button type="submit" disabled={form_state === 'submitting'}>
            {#if form_state === 'submitting'}
              Sending...
            {:else}
              {button_text || 'Send Message'}
            {/if}
          </button>
          {#if form_state === 'success'}
            <div class="form-message success">Your message has been sent successfully!</div>
          {/if}
          {#if form_state === 'error'}
            <div class="form-message error">There was an error sending your message. Please try again.</div>
          {/if}
        </form>
      {/if}
    </div>
  </div>
</section>

<style>
.contact-form-section {
  padding: var(--theme-section-padding, 5rem) 0;
  background: var(--theme-background-secondary, #f8fafc);
}

.contact-form-wrapper {
  max-width: 640px;
  margin: 0 auto;
}

.contact-form-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.contact-form-header h2 {
  font-family: var(--theme-heading-font, system-ui);
  font-size: 2rem;
  font-weight: 700;
  color: var(--theme-text, #0f172a);
  margin-bottom: 0.75rem;
}

.contact-form-header p {
  font-size: 1.125rem;
  color: var(--theme-text-muted, #64748b);
}

.contact-form {
  background: var(--theme-background, white);
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  border: 1px solid var(--theme-border-color, #e2e8f0);
}

.form-row {
  display: grid;
  gap: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-text, #374151);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--theme-border-color, #d1d5db);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: var(--theme-background, white);
  color: var(--theme-text, #0f172a);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--theme-primary, #6366f1);
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.contact-form button {
  width: 100%;
  padding: 1rem 2rem;
  background: var(--theme-primary, #6366f1);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}

.contact-form button:hover:not(:disabled) {
  background: var(--theme-primary-dark, #4f46e5);
}

.contact-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  text-align: center;
}

.form-message.success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}

.form-message.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .contact-form {
    padding: 1.5rem;
  }
}
</style>
