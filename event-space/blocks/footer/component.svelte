<footer class="footer">
	<div class="container">
		<div class="footer-grid">
			<div class="footer-brand">
				<a href="/" class="logo">
					{#if site.logo?.type === 'image' && site.logo?.image?.url}
						<img src={site.logo.image.url} alt={site.site_name} />
					{:else}
						<span class="logo-text">{site.logo?.text || site.site_name}</span>
					{/if}
				</a>
				{#if tagline}
					<p class="tagline">{tagline}</p>
				{/if}
				{#if site.social_links?.length}
					<div class="social-links">
						{#each site.social_links as social}
							<a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
								{#if social.platform === 'instagram'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
								{:else if social.platform === 'facebook'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
								{:else if social.platform === 'pinterest'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.94-.2-2.4.04-3.44l1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.02 0 1.52.77 1.52 1.7 0 1.03-.66 2.58-1 4.02-.28 1.2.6 2.18 1.78 2.18 2.13 0 3.77-2.25 3.77-5.5 0-2.87-2.06-4.88-5-4.88-3.41 0-5.4 2.56-5.4 5.2 0 1.03.4 2.13.9 2.73.1.12.11.22.08.34l-.33 1.37c-.05.22-.18.27-.4.16-1.5-.7-2.43-2.87-2.43-4.62 0-3.76 2.73-7.22 7.88-7.22 4.14 0 7.36 2.95 7.36 6.9 0 4.12-2.6 7.43-6.2 7.43-1.21 0-2.35-.63-2.74-1.38l-.75 2.84c-.27 1.04-1 2.35-1.49 3.14A12 12 0 1 0 12 0z"/></svg>
								{:else if social.platform === 'linkedin'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			<div class="footer-nav">
				<h4>Quick Links</h4>
				{#if site.nav_links?.length}
					<ul>
						{#each site.nav_links as item}
							<li><a href={item.link?.url}>{item.link?.label}</a></li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="footer-contact">
				<h4>Contact</h4>
				<ul>
					{#if site.address}
						<li>{site.address}</li>
					{/if}
					{#if site.phone}
						<li><a href="tel:{site.phone}">{site.phone}</a></li>
					{/if}
					{#if site.email}
						<li><a href="mailto:{site.email}">{site.email}</a></li>
					{/if}
				</ul>
			</div>
		</div>

		<div class="footer-bottom">
			{#if site.copyright}
				<p>&copy; {site.copyright}</p>
			{/if}
		</div>
	</div>
</footer>

<style>
.footer {
	background: #1a1a1a;
	color: white;
	padding: 4rem 0 0;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.footer-grid {
	display: grid;
	grid-template-columns: 2fr 1fr 1fr;
	gap: 4rem;
	padding-bottom: 3rem;
	border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo {
	display: inline-block;
	text-decoration: none;
	margin-bottom: 1rem;
}

.logo img {
	height: 40px;
	width: auto;
}

.logo-text {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: 1.5rem;
	font-weight: 700;
	color: white;
}

.tagline {
	color: rgba(255,255,255,0.7);
	line-height: 1.6;
	margin: 0 0 1.5rem;
	max-width: 300px;
}

.social-links {
	display: flex;
	gap: 1rem;
}

.social-links a {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	background: rgba(255,255,255,0.1);
	border-radius: 8px;
	color: white;
	transition: background 0.2s;
}

.social-links a:hover {
	background: var(--theme-primary, #B8860B);
}

h4 {
	font-family: var(--theme-heading-font, 'Playfair Display', serif);
	font-size: 1.125rem;
	font-weight: 600;
	margin: 0 0 1.5rem;
	color: white;
}

.footer-nav ul,
.footer-contact ul {
	list-style: none;
	padding: 0;
	margin: 0;
}

.footer-nav li,
.footer-contact li {
	margin-bottom: 0.75rem;
}

.footer-nav a,
.footer-contact a {
	color: rgba(255,255,255,0.7);
	text-decoration: none;
	transition: color 0.2s;
}

.footer-nav a:hover,
.footer-contact a:hover {
	color: var(--theme-primary, #B8860B);
}

.footer-contact li {
	color: rgba(255,255,255,0.7);
}

.footer-bottom {
	padding: 1.5rem 0;
	text-align: center;
}

.footer-bottom p {
	margin: 0;
	font-size: 0.875rem;
	color: rgba(255,255,255,0.5);
}

@media (max-width: 768px) {
	.footer-grid {
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}

	.tagline {
		max-width: none;
	}
}
</style>
