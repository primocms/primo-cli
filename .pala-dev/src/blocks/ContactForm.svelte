<section class="contact-form">
	<div class="container">
		<div class="grid">
			<div class="info">
				{#if title}
					<h2>{title}</h2>
				{/if}
				{#if subtitle}
					<p class="subtitle">{subtitle}</p>
				{/if}

				<div class="contact-details">
					{#if email}
						<div class="detail">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
							<a href="mailto:{email}">{email}</a>
						</div>
					{/if}
					{#if phone}
						<div class="detail">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
							<a href="tel:{phone}">{phone}</a>
						</div>
					{/if}
					{#if address}
						<div class="detail">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
							<span>{address}</span>
						</div>
					{/if}
				</div>
			</div>

			<div class="form-wrapper">
				<form onsubmit={handle_submit} bind:this={form_element}>
					<div class="form-row">
						<div class="form-group">
							<label for="name">Name</label>
							<input type="text" id="name" name="name" required />
						</div>
						<div class="form-group">
							<label for="email">Email</label>
							<input type="email" id="email" name="email" required />
						</div>
					</div>
					<div class="form-group">
						<label for="subject">Subject</label>
						<input type="text" id="subject" name="subject" required />
					</div>
					<div class="form-group">
						<label for="message">Message</label>
						<textarea id="message" name="message" rows="5" required></textarea>
					</div>
					<button type="submit" disabled={form_state === 'submitting'}>
						{#if form_state === 'submitting'}
							Sending...
						{:else}
							Send Message
						{/if}
					</button>

					{#if form_state === 'success'}
						<div class="alert success">Message sent successfully! We'll be in touch soon.</div>
					{/if}

					{#if form_state === 'error'}
						<div class="alert error">Something went wrong. Please try again.</div>
					{/if}
				</form>
			</div>
		</div>
	</div>
</section>

<script>
	let { title = '', subtitle = '', email = '', phone = '', address = '', endpoint = undefined } = $props()

	let form_state = $state('idle')
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

<style>
.contact-form {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background, #ffffff);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.grid {
	display: grid;
	grid-template-columns: 1fr 1.2fr;
	gap: 4rem;
	align-items: start;
}

h2 {
	font-size: 2rem;
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.0625rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0 0 2rem;
}

.contact-details {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.detail {
	display: flex;
	align-items: flex-start;
	gap: 1rem;
}

.detail svg {
	flex-shrink: 0;
	color: var(--theme-primary, #6366f1);
}

.detail a,
.detail span {
	color: var(--theme-text, #1e293b);
	text-decoration: none;
	font-size: 1rem;
}

.detail a:hover {
	color: var(--theme-primary, #6366f1);
}

.form-wrapper {
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 2rem;
}

.form-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
}

.form-group {
	margin-bottom: 1.25rem;
}

label {
	display: block;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--theme-text, #0f172a);
	margin-bottom: 0.5rem;
}

input,
textarea {
	width: 100%;
	padding: 0.875rem 1rem;
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 8px;
	font-size: 1rem;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
	background: white;
}

input:focus,
textarea:focus {
	outline: none;
	border-color: var(--theme-primary, #6366f1);
	box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

button {
	width: 100%;
	padding: 1rem 2rem;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	border: none;
	border-radius: 10px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.3s ease;
}

button:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

button:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.alert {
	margin-top: 1rem;
	padding: 1rem;
	border-radius: 8px;
	font-size: 0.9375rem;
}

.alert.success {
	background: #dcfce7;
	color: #166534;
}

.alert.error {
	background: #fee2e2;
	color: #991b1b;
}

@media (max-width: 768px) {
	.grid {
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	.form-row {
		grid-template-columns: 1fr;
	}
}
</style>
