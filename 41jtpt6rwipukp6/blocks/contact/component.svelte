<script>
let form_state = $state('idle')

async function handle_submit(event) {
	event.preventDefault()
	if (!form_endpoint) return

	form_state = 'submitting'
	const form_data = new FormData(event.target)

	try {
		const response = await fetch(form_endpoint, {
			method: 'POST',
			body: form_data
		})

		if (response.ok) {
			form_state = 'success'
			event.target.reset()
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

<section class="contact" id="contact-form">
  <div class="pala-block-container">
    <div class="contact-wrapper">
      <div class="contact-info">
        {#if title}
          <h2 class="section-title">{title}</h2>
        {/if}
        {#if subtitle}
          <p class="section-subtitle">{subtitle}</p>
        {/if}
        <div class="info-items">
          {#if email}
            <div class="info-item">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div class="info-content">
                <span class="info-label">Email</span>
                <a href="mailto:{email}">{email}</a>
              </div>
            </div>
          {/if}
          {#if phone}
            <div class="info-item">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div class="info-content">
                <span class="info-label">Phone</span>
                <a href="tel:{phone}">{phone}</a>
              </div>
            </div>
          {/if}
          {#if address}
            <div class="info-item">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div class="info-content">
                <span class="info-label">Address</span>
                <span>{address}</span>
              </div>
            </div>
          {/if}
        </div>
        <div class="office-hours">
          <h4>Office Hours</h4>
          <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
          <p>Saturday - Sunday: Closed</p>
        </div>
      </div>
      <form class="contact-form" onsubmit={handle_submit}>
        <h3>Send Us a Message</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" placeholder="Your name" required />
          </div>
          <div class="form-group">
            <label for="company">Company</label>
            <input type="text" id="company" name="company" placeholder="Your company" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="your@email.com" required />
          </div>
          <div class="form-group">
            <label for="phone">Phone</label>
            <input type="tel" id="phone" name="phone" placeholder="(555) 123-4567" />
          </div>
        </div>
        <div class="form-group">
          <label for="subject">How can we help?</label>
          <select id="subject" name="subject">
            <option value="">Select a topic...</option>
            <option value="strategy">Strategy Consulting</option>
            <option value="operations">Operations Excellence</option>
            <option value="digital">Digital Transformation</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" name="message" rows="4" placeholder="Tell us about your project or challenge..." required></textarea>
        </div>
        <button type="submit" class="submit-btn" disabled={form_state === 'submitting'}>
          {#if form_state === 'submitting'}
            Sending...
          {:else}
            Send Message
          {/if}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
        {#if form_state === 'success'}
          <div class="form-message success">
            Thanks for reaching out! We'll get back to you soon.
          </div>
        {:else if form_state === 'error'}
          <div class="form-message error">
            There was an error sending your message. Please try again.
          </div>
        {/if}
      </form>
    </div>
  </div>
</section>

<style>
.contact {
  padding: 7rem 0;
  background: linear-gradient(180deg, #f8fafc 0%, white 100%);
}

.contact-wrapper {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 4rem;
  align-items: start;
}

.section-title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  margin-bottom: 0.75rem;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 2.5rem;
  line-height: 1.7;
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  font-weight: 600;
}

.info-content a,
.info-content span {
  color: #0f172a;
  text-decoration: none;
  font-size: 1.0625rem;
  font-weight: 500;
  transition: color 0.2s;
}

.info-content a:hover {
  color: #6366f1;
}

.office-hours {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;

  h4 {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  p {
    color: #475569;
    font-size: 0.9375rem;
    margin: 0.25rem 0;
  }
}

.contact-form {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 2rem;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.form-group {
  margin-bottom: 1.25rem;

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #334155;
    font-size: 0.9375rem;
  }

  input, textarea, select {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    background: #f8fafc;

    &:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      background: white;
    }

    &::placeholder {
      color: #94a3b8;
    }
  }

  select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 1rem center;
    background-size: 16px;
    padding-right: 2.5rem;
  }

  textarea {
    resize: vertical;
    min-height: 120px;
  }
}

.submit-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;

  svg {
    transition: transform 0.3s ease;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);

    svg {
      transform: translateX(4px);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.form-message {
  margin-top: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 10px;
  font-size: 0.9375rem;
  text-align: center;
  font-weight: 500;
}

.form-message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.form-message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

@media (max-width: 1024px) {
  .contact-wrapper {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}

@media (max-width: 640px) {
  .contact {
    padding: 4rem 0;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .contact-form {
    padding: 1.5rem;
  }
}
</style>
