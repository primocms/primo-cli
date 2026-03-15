<script>
let newsletter_state = $state('idle')
let current_year = $state('')

if (typeof window !== 'undefined') {
	current_year = new Date().getFullYear().toString()
}

async function handle_newsletter_submit(event) {
	event.preventDefault()
	if (!newsletter_endpoint) return

	newsletter_state = 'submitting'
	const form_data = new FormData(event.target)

	try {
		const response = await fetch(newsletter_endpoint, {
			method: 'POST',
			body: form_data
		})

		if (response.ok) {
			newsletter_state = 'success'
			event.target.reset()
			setTimeout(() => newsletter_state = 'idle', 5000)
		} else {
			newsletter_state = 'error'
			setTimeout(() => newsletter_state = 'idle', 5000)
		}
	} catch (error) {
		newsletter_state = 'error'
		setTimeout(() => newsletter_state = 'idle', 5000)
	}
}
</script>

<footer>
	<div class="pala-block-container">
		<div class="footer-grid">
			<!-- Brand Column -->
			<div class="footer-brand">
				<a href="/" class="footer-logo">
					{#if logo?.type === 'text' && logo?.text}
						<span>{logo.text}</span>
					{:else if logo?.type === 'image' && logo?.image?.url}
						<img src={logo.image.url} alt={logo.image.alt || 'Logo'} />
					{:else}
						<span>Your Brand</span>
					{/if}
				</a>

				{#if tagline}
					<p class="tagline">{tagline}</p>
				{/if}

				{#if social_links?.length}
					<div class="social-links">
						{#each social_links as social}
							<a href={social.url} aria-label={social.platform}>
								{#if social.platform === 'linkedin'}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
								{:else if social.platform === 'twitter'}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
								{:else if social.platform === 'facebook'}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
								{:else if social.platform === 'instagram'}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
								{:else if social.platform === 'youtube'}
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Link Groups -->
			{#if link_groups?.length}
				{#each link_groups as group}
					<div class="footer-links">
						{#if group.title}
							<h4>{group.title}</h4>
						{/if}
						{#if group.links?.length}
							<nav>
								{#each group.links as item}
									{#if item.link?.url && item.link?.label}
										<a href={item.link.url}>{item.link.label}</a>
									{/if}
								{/each}
							</nav>
						{/if}
					</div>
				{/each}
			{/if}

			<!-- Newsletter -->
			{#if newsletter_title || newsletter_text}
				<div class="newsletter-column">
					<h4>{newsletter_title || 'Stay Updated'}</h4>
					{#if newsletter_text}
						<p>{newsletter_text}</p>
					{/if}
					{#if newsletter_endpoint}
						<form onsubmit={handle_newsletter_submit}>
							<div class="input-group">
								<input
									type="email"
									name="email"
									placeholder="Enter your email"
									required
								/>
								<button type="submit" disabled={newsletter_state === 'submitting'}>
									{#if newsletter_state === 'submitting'}
										...
									{:else}
										Subscribe
									{/if}
								</button>
							</div>
							{#if newsletter_state === 'success'}
								<p class="message success">Thanks for subscribing!</p>
							{:else if newsletter_state === 'error'}
								<p class="message error">Error. Please try again.</p>
							{/if}
						</form>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Bottom Bar -->
		<div class="footer-bottom">
			<p>{copyright || '© ' + current_year + ' All rights reserved.'}</p>
		</div>
	</div>
</footer>

<style>
footer {
	background: var(--theme-background-secondary, #0f172a);
	color: var(--theme-text-light, #e2e8f0);
	padding: var(--theme-section-padding, 5rem) 0 2rem;
}

.footer-grid {
	display: grid;
	grid-template-columns: 1.5fr 1fr 1fr 1fr 1fr;
	gap: 3rem;
	margin-bottom: 3rem;
}

.footer-brand {
	max-width: 320px;
}

.footer-logo {
	display: inline-block;
	text-decoration: none;
	margin-bottom: 1.25rem;
}

.footer-logo span {
	font-family: var(--theme-heading-font, system-ui);
	font-size: 1.5rem;
	font-weight: 700;
	color: white;
	letter-spacing: -0.02em;
}

.footer-logo img {
	height: 32px;
	width: auto;
}

.tagline {
	color: var(--theme-text-muted, #94a3b8);
	font-size: 0.9375rem;
	line-height: 1.6;
	margin-bottom: 1.5rem;
}

.social-links {
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
}

.social-links a {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	color: var(--theme-text-muted, #94a3b8);
	transition: all 0.2s;
}

.social-links a:hover {
	background: var(--theme-primary, #6366f1);
	color: white;
	transform: translateY(-2px);
}

.footer-links h4 {
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: white;
	margin-bottom: 1.25rem;
}

.footer-links nav {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.footer-links a {
	color: var(--theme-text-muted, #94a3b8);
	text-decoration: none;
	font-size: 0.9375rem;
	transition: color 0.2s;
}

.footer-links a:hover {
	color: var(--theme-primary, #6366f1);
}

.newsletter-column h4 {
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: white;
	margin-bottom: 0.75rem;
}

.newsletter-column p {
	color: var(--theme-text-muted, #94a3b8);
	font-size: 0.875rem;
	margin-bottom: 1rem;
	line-height: 1.6;
}

.input-group {
	display: flex;
	gap: 0.5rem;
}

.input-group input {
	flex: 1;
	padding: 0.625rem 1rem;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	color: white;
	font-size: 0.875rem;
}

.input-group input::placeholder {
	color: rgba(255, 255, 255, 0.4);
}

.input-group input:focus {
	outline: none;
	border-color: var(--theme-primary, #6366f1);
	background: rgba(255, 255, 255, 0.15);
}

.input-group button {
	padding: 0.625rem 1.25rem;
	background: var(--theme-primary, #6366f1);
	color: white;
	border: none;
	border-radius: 8px;
	font-size: 0.875rem;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.2s;
	white-space: nowrap;
}

.input-group button:hover:not(:disabled) {
	background: var(--theme-primary-dark, #4f46e5);
	transform: translateY(-1px);
}

.input-group button:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.message {
	margin-top: 0.75rem;
	padding: 0.625rem 1rem;
	border-radius: 6px;
	font-size: 0.8125rem;
	text-align: center;
}

.message.success {
	background: rgba(16, 185, 129, 0.1);
	color: #6ee7b7;
	border: 1px solid rgba(110, 231, 183, 0.2);
}

.message.error {
	background: rgba(239, 68, 68, 0.1);
	color: #fca5a5;
	border: 1px solid rgba(252, 165, 165, 0.2);
}

.footer-bottom {
	padding-top: 2rem;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
	text-align: center;
}

.footer-bottom p {
	color: var(--theme-text-muted, #64748b);
	font-size: 0.875rem;
	margin: 0;
}

@media (max-width: 1024px) {
	.footer-grid {
		grid-template-columns: 1fr 1fr;
		gap: 2.5rem;
	}

	.footer-brand {
		grid-column: span 2;
		max-width: none;
	}
}

@media (max-width: 640px) {
	footer {
		padding: 3rem 0 1.5rem;
	}

	.footer-grid {
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	.footer-brand {
		grid-column: span 1;
	}

	.input-group {
		flex-direction: column;
	}

	.input-group button {
		width: 100%;
	}
}
</style>
