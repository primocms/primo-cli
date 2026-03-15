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

				{#if email}
					<a href="mailto:{email}" class="email-link">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
						{email}
					</a>
				{/if}

				{#if show_socials && $site?.social_links?.length}
					<div class="social-links">
						{#each $site.social_links as social}
							<a href={social.url} class="social-link" target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
								{#if social.platform === 'github'}
									<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
								{:else if social.platform === 'linkedin'}
									<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
								{:else if social.platform === 'twitter'}
									<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
								{:else if social.platform === 'email'}
									<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
								{:else if social.platform === 'dribbble'}
									<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.628 0-12 5.373-12 12s5.372 12 12 12 12-5.373 12-12-5.372-12-12-12zm9.885 11.441c-2.575-.422-4.943-.445-7.103-.073-.244-.563-.497-1.125-.767-1.68 2.31-1 4.165-2.358 5.548-4.082 1.35 1.594 2.197 3.619 2.322 5.835zm-3.842-7.282c-1.205 1.554-2.868 2.783-4.986 3.68-1.016-1.861-2.178-3.676-3.488-5.438.779-.197 1.591-.314 2.431-.314 2.275 0 4.368.779 6.043 2.072zm-10.516-.993c1.331 1.742 2.511 3.538 3.537 5.381-2.43.715-5.331 1.082-8.684 1.105.692-2.835 2.601-5.193 5.147-6.486zm-5.44 8.834l.013-.256c3.849-.005 7.169-.448 9.95-1.322.233.475.456.952.67 1.432-3.38 1.057-6.165 3.222-8.337 6.48-1.432-1.719-2.296-3.927-2.296-6.334zm3.829 7.81c1.969-3.088 4.482-5.098 7.598-6.027.928 2.42 1.609 4.91 2.043 7.46-3.349 1.291-6.953.666-9.641-1.433zm11.586.43c-.438-2.353-1.08-4.653-1.92-6.897 1.876-.265 3.94-.196 6.199.196-.437 2.786-2.028 5.192-4.279 6.701z"/></svg>
								{:else if social.platform === 'codepen'}
									<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/><polyline points="2 15.5 12 8.5 22 15.5"/><line x1="12" y1="2" x2="12" y2="8.5"/></svg>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			{#if show_form}
				<div class="contact-form-wrapper">
					<form onsubmit={handle_submit} bind:this={form_element}>
						<div class="form-group">
							<label for="name">Name</label>
							<input type="text" id="name" name="name" required />
						</div>

						<div class="form-group">
							<label for="email">Email</label>
							<input type="email" id="email" name="email" required />
						</div>

						<div class="form-group">
							<label for="message">Message</label>
							<textarea id="message" name="message" rows="5" required></textarea>
						</div>

						<button type="submit" class="submit-btn" disabled={form_state === 'submitting'}>
							{#if form_state === 'submitting'}
								<svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
								Sending...
							{:else}
								Send Message
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
							{/if}
						</button>

						{#if form_state === 'success'}
							<div class="form-message success">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
								Message sent! I'll get back to you soon.
							</div>
						{/if}

						{#if form_state === 'error'}
							<div class="form-message error">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
								Something went wrong. Please try again.
							</div>
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
	background: var(--theme-background, #ffffff);
}

.container {
	max-width: 1100px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.contact-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	align-items: start;
}

.contact-info {
	max-width: 480px;
}

.badge {
	display: inline-block;
	background: rgba(99, 102, 241, 0.1);
	color: var(--theme-primary, #6366f1);
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
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0 0 2rem;
}

.email-link {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	color: var(--theme-primary, #6366f1);
	font-size: 1.125rem;
	font-weight: 500;
	text-decoration: none;
	margin-bottom: 2rem;
	transition: color 0.2s ease;
}

.email-link:hover {
	color: #4f46e5;
}

.social-links {
	display: flex;
	gap: 1rem;
}

.social-link {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 12px;
	color: var(--theme-text-muted, #64748b);
	transition: all 0.3s ease;
}

.social-link:hover {
	background: var(--theme-primary, #6366f1);
	border-color: var(--theme-primary, #6366f1);
	color: white;
	transform: translateY(-2px);
}

.contact-form-wrapper {
	background: var(--theme-background-secondary, #f8fafc);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 20px;
	padding: 2rem;
}

.form-group {
	margin-bottom: 1.5rem;
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
	background: var(--theme-background, #ffffff);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 10px;
	font-size: 1rem;
	color: var(--theme-text, #0f172a);
	transition: all 0.2s ease;
	font-family: inherit;
}

input:focus,
textarea:focus {
	outline: none;
	border-color: var(--theme-primary, #6366f1);
	box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

textarea {
	resize: vertical;
	min-height: 120px;
}

.submit-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	width: 100%;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	padding: 1rem 2rem;
	border: none;
	border-radius: 12px;
	font-size: 1rem;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
}

.submit-btn:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.spinner {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.form-message {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-top: 1rem;
	padding: 1rem;
	border-radius: 10px;
	font-size: 0.9375rem;
	font-weight: 500;
}

.form-message.success {
	background: rgba(34, 197, 94, 0.1);
	color: #16a34a;
}

.form-message.error {
	background: rgba(239, 68, 68, 0.1);
	color: #dc2626;
}

@media (max-width: 768px) {
	.contact-grid {
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}
}
</style>
