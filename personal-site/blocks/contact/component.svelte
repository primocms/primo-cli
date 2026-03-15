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
	<div class="container">
		<div class="contact-grid">
			<div class="contact-content">
				{#if badge}
					<span class="badge">{badge}</span>
				{/if}

				{#if title}
					<h2>{title}</h2>
				{/if}

				{#if subtitle}
					<p class="subtitle">{subtitle}</p>
				{/if}

				{#if email}
					<a href="mailto:{email}" class="email-link">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
						{email}
					</a>
				{/if}

				{#if $site?.social_links?.length}
					<div class="social-links">
						{#each $site.social_links as social}
							<a href={social.url} class="social-link" target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
								{#if social.platform === 'github'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
								{:else if social.platform === 'linkedin'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
								{:else if social.platform === 'twitter'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
								{:else if social.platform === 'instagram'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
								{:else if social.platform === 'youtube'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			{#if show_form}
				<div class="contact-form-wrapper">
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
							<input type="text" id="subject" name="subject" />
						</div>

						<div class="form-group">
							<label for="message">Message</label>
							<textarea id="message" name="message" rows="5" required></textarea>
						</div>

						<button type="submit" class="submit-btn" disabled={form_state === 'submitting'}>
							{#if form_state === 'submitting'}
								Sending...
							{:else}
								{button_text || 'Send Message'}
							{/if}
						</button>

						{#if form_state === 'success'}
							<div class="form-message success">Message sent successfully!</div>
						{/if}

						{#if form_state === 'error'}
							<div class="form-message error">Something went wrong. Please try again.</div>
						{/if}
					</form>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
.contact {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #f8fafc);
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

.contact-content {
	max-width: 400px;
}

.badge {
	display: inline-block;
	background: rgba(15, 23, 42, 0.06);
	color: var(--theme-text, #0f172a);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
}

h2 {
	font-size: clamp(2rem, 4vw, 2.75rem);
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.0625rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0 0 2rem;
}

.email-link {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	color: var(--theme-text, #0f172a);
	font-weight: 600;
	font-size: 1.125rem;
	text-decoration: none;
	margin-bottom: 2rem;
}

.email-link:hover {
	text-decoration: underline;
}

.social-links {
	display: flex;
	gap: 0.75rem;
}

.social-link {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 10px;
	color: var(--theme-text-muted, #64748b);
	background: var(--theme-background, white);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	transition: all 0.2s ease;
}

.social-link:hover {
	color: var(--theme-text, #0f172a);
	border-color: var(--theme-text, #0f172a);
}

.contact-form-wrapper {
	background: var(--theme-background, white);
	padding: 2rem;
	border-radius: 16px;
	border: 1px solid var(--theme-border-color, #e2e8f0);
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
	border-radius: 10px;
	font-size: 1rem;
	font-family: inherit;
	background: var(--theme-background, white);
	transition: border-color 0.2s ease;
}

input:focus,
textarea:focus {
	outline: none;
	border-color: var(--theme-text, #0f172a);
}

textarea {
	resize: vertical;
	min-height: 120px;
}

.submit-btn {
	width: 100%;
	padding: 1rem;
	background: var(--theme-primary, #0f172a);
	color: white;
	border: none;
	border-radius: 10px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
}

.submit-btn:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.form-message {
	margin-top: 1rem;
	padding: 1rem;
	border-radius: 8px;
	text-align: center;
	font-weight: 500;
}

.form-message.success {
	background: #ecfdf5;
	color: #059669;
}

.form-message.error {
	background: #fef2f2;
	color: #dc2626;
}

@media (max-width: 968px) {
	.contact-grid {
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	.contact-content {
		max-width: 100%;
		text-align: center;
	}

	.email-link {
		justify-content: center;
	}

	.social-links {
		justify-content: center;
	}
}

@media (max-width: 640px) {
	.form-row {
		grid-template-columns: 1fr;
	}
}
</style>
