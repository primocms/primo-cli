<script>
let form_state = $state('idle')
let form_element = $state(null)

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

<section class="contact" id="contact">
	<div class="container">
		<div class="contact-grid">
			<div class="contact-info">
				{#if badge}
					<span class="badge">{badge}</span>
				{/if}
				{#if title}
					<h2>{title}</h2>
				{/if}
				{#if subtitle}
					<p class="subtitle">{subtitle}</p>
				{/if}

				<div class="info-items">
					{#if site.address}
						<div class="info-item">
							<div class="info-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
							</div>
							<div>
								<strong>Address</strong>
								<p>{site.address}</p>
							</div>
						</div>
					{/if}
					{#if site.phone}
						<div class="info-item">
							<div class="info-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
							</div>
							<div>
								<strong>Phone</strong>
								<p><a href="tel:{site.phone}">{site.phone}</a></p>
							</div>
						</div>
					{/if}
					{#if site.email}
						<div class="info-item">
							<div class="info-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
							</div>
							<div>
								<strong>Email</strong>
								<p><a href="mailto:{site.email}">{site.email}</a></p>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="contact-form-wrapper">
				<form onsubmit={handle_submit} bind:this={form_element} class="contact-form">
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
						<label for="phone">Phone</label>
						<input type="tel" id="phone" name="phone" />
					</div>
					<div class="form-group">
						<label for="event_type">Event Type</label>
						<select id="event_type" name="event_type">
							<option value="">Select an event type</option>
							<option value="wedding">Wedding</option>
							<option value="corporate">Corporate Event</option>
							<option value="gala">Gala / Fundraiser</option>
							<option value="birthday">Birthday / Anniversary</option>
							<option value="other">Other</option>
						</select>
					</div>
					<div class="form-group">
						<label for="date">Preferred Date</label>
						<input type="date" id="date" name="date" />
					</div>
					<div class="form-group">
						<label for="guests">Estimated Guests</label>
						<input type="number" id="guests" name="guests" min="1" />
					</div>
					<div class="form-group">
						<label for="message">Message</label>
						<textarea id="message" name="message" rows="4"></textarea>
					</div>
					<button type="submit" disabled={form_state === 'submitting'}>
						{#if form_state === 'submitting'}
							Sending...
						{:else}
							Send Inquiry
						{/if}
					</button>

					{#if form_state === 'success'}
						<div class="form-message success">
							{success_message || 'Thank you! We will be in touch soon.'}
						</div>
					{/if}

					{#if form_state === 'error'}
						<div class="form-message error">
							Something went wrong. Please try again.
						</div>
					{/if}
				</form>
			</div>
		</div>
	</div>
</section>

<style>
.contact {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background, #FDFBF7);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.contact-grid {
	display: grid;
	grid-template-columns: 1fr 1.2fr;
	gap: 4rem;
	align-items: start;
}

.badge {
	display: inline-block;
	background: var(--theme-primary, #B8860B);
	color: white;
	padding: 0.375rem 1rem;
	border-radius: 50px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-bottom: 1rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: clamp(2rem, 4vw, 2.5rem);
	font-weight: 700;
	color: var(--theme-text, #1a1a1a);
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.0625rem;
	color: var(--theme-text-muted, #666666);
	line-height: 1.6;
	margin: 0 0 2rem;
}

.info-items {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.info-item {
	display: flex;
	gap: 1rem;
}

.info-icon {
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--theme-background-secondary, #F5F1E8);
	border-radius: 8px;
	color: var(--theme-primary, #B8860B);
	flex-shrink: 0;
}

.info-item strong {
	display: block;
	color: var(--theme-text, #1a1a1a);
	margin-bottom: 0.25rem;
}

.info-item p {
	margin: 0;
	color: var(--theme-text-muted, #666666);
}

.info-item a {
	color: var(--theme-text-muted, #666666);
	text-decoration: none;
}

.info-item a:hover {
	color: var(--theme-primary, #B8860B);
}

.contact-form-wrapper {
	background: white;
	padding: 2.5rem;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0,0,0,0.08);
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
	font-weight: 500;
	color: var(--theme-text, #1a1a1a);
	margin-bottom: 0.5rem;
	font-size: 0.9375rem;
}

input,
select,
textarea {
	width: 100%;
	padding: 0.875rem 1rem;
	border: 1px solid var(--theme-border-color, #E8E0D0);
	border-radius: 6px;
	font-size: 1rem;
	font-family: inherit;
	transition: border-color 0.2s, box-shadow 0.2s;
	background: var(--theme-background, #FDFBF7);
}

input:focus,
select:focus,
textarea:focus {
	outline: none;
	border-color: var(--theme-primary, #B8860B);
	box-shadow: 0 0 0 3px rgba(184, 134, 11, 0.1);
}

button[type="submit"] {
	width: 100%;
	padding: 1rem;
	background: var(--theme-primary, #B8860B);
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: background 0.2s;
}

button[type="submit"]:hover:not(:disabled) {
	background: var(--theme-primary-dark, #8B6914);
}

button[type="submit"]:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.form-message {
	margin-top: 1rem;
	padding: 1rem;
	border-radius: 6px;
	text-align: center;
}

.form-message.success {
	background: #ecfdf5;
	color: #065f46;
}

.form-message.error {
	background: #fef2f2;
	color: #991b1b;
}

@media (max-width: 768px) {
	.contact-grid {
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	.form-row {
		grid-template-columns: 1fr;
	}

	.contact-form-wrapper {
		padding: 1.5rem;
	}
}
</style>
