<script>
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

<section class="contact" id="contact">
	<div class="contact-bg">
		{#if image?.url}
			<img src={image.url} alt="" class="contact-image" />
		{/if}
		<div class="contact-overlay"></div>
	</div>

	<div class="contact-container">
		<div class="contact-info">
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}

			<div class="contact-details">
				{#if site?.email}
					<a href="mailto:{site.email}" class="contact-link">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect width="20" height="16" x="2" y="4" rx="2"/>
							<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
						</svg>
						{site.email}
					</a>
				{/if}
				{#if site?.phone}
					<a href="tel:{site.phone}" class="contact-link">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
						</svg>
						{site.phone}
					</a>
				{/if}
				{#if site?.location}
					<span class="contact-link">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
							<circle cx="12" cy="10" r="3"/>
						</svg>
						{site.location}
					</span>
				{/if}
			</div>
		</div>

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
				<label for="service">Service Interested In</label>
				<select id="service" name="service">
					<option value="">Select a service</option>
					<option value="wedding">Wedding Photography</option>
					<option value="portrait">Portrait Session</option>
					<option value="commercial">Commercial & Editorial</option>
					<option value="other">Other</option>
				</select>
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
				<div class="form-message success">Thank you! I'll get back to you soon.</div>
			{/if}

			{#if form_state === 'error'}
				<div class="form-message error">Something went wrong. Please try again.</div>
			{/if}
		</form>
	</div>
</section>

<style>
.contact {
	position: relative;
	padding: var(--theme-section-padding, 8rem) 0;
	min-height: 100vh;
	display: flex;
	align-items: center;
}

.contact-bg {
	position: absolute;
	inset: 0;
	z-index: 0;
	background: #0a0a0a;
}

.contact-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0.3;
}

.contact-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0.8) 100%);
}

.contact-container {
	position: relative;
	z-index: 1;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 2rem;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 6rem;
	align-items: start;
}

.contact-info {
	max-width: 400px;
}

h2 {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: clamp(2.5rem, 5vw, 4rem);
	font-weight: 300;
	color: white;
	margin: 0 0 1.5rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.5);
	line-height: 1.7;
	margin: 0 0 3rem;
	font-weight: 300;
}

.contact-details {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.contact-link {
	display: flex;
	align-items: center;
	gap: 1rem;
	color: rgba(255, 255, 255, 0.7);
	text-decoration: none;
	font-size: 0.9375rem;
	transition: color 0.3s ease;
}

a.contact-link:hover {
	color: white;
}

.contact-link svg {
	opacity: 0.5;
}

.contact-form {
	background: rgba(255, 255, 255, 0.03);
	border: 1px solid rgba(255, 255, 255, 0.08);
	padding: 3rem;
}

.form-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1.5rem;
}

.form-group {
	margin-bottom: 1.5rem;
}

label {
	display: block;
	font-size: 0.6875rem;
	font-weight: 600;
	letter-spacing: 0.15em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.5);
	margin-bottom: 0.75rem;
}

input,
select,
textarea {
	width: 100%;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: white;
	padding: 1rem;
	font-size: 0.9375rem;
	font-family: inherit;
	transition: all 0.3s ease;
}

input:focus,
select:focus,
textarea:focus {
	outline: none;
	border-color: rgba(255, 255, 255, 0.3);
	background: rgba(255, 255, 255, 0.08);
}

select {
	cursor: pointer;
	appearance: none;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
	background-repeat: no-repeat;
	background-position: right 1rem center;
}

select option {
	background: #1a1a1a;
	color: white;
}

textarea {
	resize: vertical;
	min-height: 120px;
}

button[type="submit"] {
	width: 100%;
	background: white;
	color: #0a0a0a;
	border: none;
	padding: 1.125rem 2rem;
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	cursor: pointer;
	transition: all 0.3s ease;
}

button[type="submit"]:hover:not(:disabled) {
	background: rgba(255, 255, 255, 0.9);
}

button[type="submit"]:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.form-message {
	margin-top: 1.5rem;
	padding: 1rem;
	text-align: center;
	font-size: 0.875rem;
}

.form-message.success {
	background: rgba(34, 197, 94, 0.1);
	border: 1px solid rgba(34, 197, 94, 0.3);
	color: #22c55e;
}

.form-message.error {
	background: rgba(239, 68, 68, 0.1);
	border: 1px solid rgba(239, 68, 68, 0.3);
	color: #ef4444;
}

@media (max-width: 968px) {
	.contact-container {
		grid-template-columns: 1fr;
		gap: 4rem;
	}

	.contact-info {
		max-width: 100%;
	}
}

@media (max-width: 640px) {
	.contact-form {
		padding: 2rem;
	}

	.form-row {
		grid-template-columns: 1fr;
	}
}
</style>
