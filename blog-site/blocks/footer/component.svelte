<footer>
	<div class="footer-container">
		<div class="footer-main">
			<div class="footer-brand">
				<a href="/" class="logo">
					{#if $site?.logo?.type === 'image' && $site?.logo?.image?.url}
						<img src={$site.logo.image.url} alt={$site?.site_name || 'Logo'} />
					{:else}
						<span class="logo-text">{$site?.logo?.text || $site?.site_name || 'Blog'}</span>
					{/if}
				</a>
				{#if $site?.footer_bio}
					<p class="footer-bio">{$site.footer_bio}</p>
				{/if}
			</div>

			<div class="footer-nav">
				{#if $site?.nav_links?.length}
					<div class="footer-links">
						<h4>Navigation</h4>
						<ul>
							{#each $site.nav_links as item}
								{#if item.link?.url}
									<li>
										<a href={item.link.url}>{item.link.label}</a>
									</li>
								{/if}
							{/each}
						</ul>
					</div>
				{/if}

				{#if $site?.social_links?.length}
					<div class="footer-social">
						<h4>Connect</h4>
						<div class="social-links">
							{#each $site.social_links as social}
								<a href={social.url} class="social-link" target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
									{#if social.platform === 'twitter'}
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
									{:else if social.platform === 'linkedin'}
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
									{:else if social.platform === 'github'}
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
									{:else if social.platform === 'instagram'}
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
									{:else if social.platform === 'youtube'}
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
									{:else if social.platform === 'email'}
										<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="footer-bottom">
			{#if $site?.copyright}
				<p class="copyright">&copy; {$site.copyright}</p>
			{/if}
		</div>
	</div>
</footer>

<style>
footer {
	background: var(--theme-text, #1a1a2e);
	color: white;
	padding: 4rem 0 2rem;
}

.footer-container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.footer-main {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	padding-bottom: 3rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-brand {
	max-width: 320px;
}

.logo {
	display: inline-block;
	text-decoration: none;
	margin-bottom: 1rem;
}

.logo img {
	height: 32px;
	width: auto;
	filter: brightness(0) invert(1);
}

.logo-text {
	font-family: var(--theme-heading-font, 'Georgia', serif);
	font-size: 1.5rem;
	font-weight: 700;
	color: white;
}

.footer-bio {
	color: rgba(255, 255, 255, 0.7);
	font-size: 0.9375rem;
	line-height: 1.6;
	margin: 0;
}

.footer-nav {
	display: flex;
	gap: 4rem;
	justify-content: flex-end;
}

.footer-links h4,
.footer-social h4 {
	font-size: 0.875rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: rgba(255, 255, 255, 0.5);
	margin: 0 0 1rem;
}

.footer-links ul {
	list-style: none;
	margin: 0;
	padding: 0;
}

.footer-links li {
	margin-bottom: 0.5rem;
}

.footer-links a {
	color: rgba(255, 255, 255, 0.8);
	text-decoration: none;
	font-size: 0.9375rem;
	transition: color 0.2s ease;
}

.footer-links a:hover {
	color: white;
}

.social-links {
	display: flex;
	gap: 0.75rem;
}

.social-link {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	color: rgba(255, 255, 255, 0.8);
	transition: all 0.2s ease;
}

.social-link:hover {
	background: var(--theme-primary, #6366f1);
	color: white;
}

.footer-bottom {
	padding-top: 2rem;
	text-align: center;
}

.copyright {
	color: rgba(255, 255, 255, 0.5);
	font-size: 0.875rem;
	margin: 0;
}

@media (max-width: 768px) {
	.footer-main {
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}

	.footer-nav {
		justify-content: flex-start;
		gap: 3rem;
	}

	.footer-brand {
		max-width: 100%;
	}
}

@media (max-width: 480px) {
	.footer-nav {
		flex-direction: column;
		gap: 2rem;
	}
}
</style>
