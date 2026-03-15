<footer class="footer">
	<div class="container">
		<div class="footer-top">
			<div class="footer-brand">
				<a href="/" class="logo">
					{#if logo?.type === 'image' && logo?.image?.url}
						<img src={logo.image.url} alt={logo.image.alt || logo.text || 'Logo'} />
					{:else if logo?.text}
						<span class="logo-text">{logo.text}</span>
					{:else}
						<span class="logo-text">MetricFlow</span>
					{/if}
				</a>
				{#if tagline}
					<p class="tagline">{tagline}</p>
				{/if}

				{#if social_links?.length}
					<div class="social-links">
						{#each social_links as social}
							<a href={social.url} class="social-link" target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
								{#if social.platform === 'twitter'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
								{:else if social.platform === 'linkedin'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
								{:else if social.platform === 'github'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
								{:else if social.platform === 'youtube'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			{#if footer_links?.length}
				<div class="footer-links">
					{#each footer_links as column}
						<div class="link-column">
							<h4>{column.column_title}</h4>
							{#if column.links?.length}
								<ul>
									{#each column.links as item}
										<li>
											<a href={item.link?.url}>{item.link?.label}</a>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="footer-bottom">
			{#if copyright}
				<p class="copyright">&copy; {copyright}</p>
			{/if}
		</div>
	</div>
</footer>

<style>
.footer {
	background: #0f172a;
	color: white;
	padding: 4rem 0 2rem;
}

.container {
	max-width: 1280px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.footer-top {
	display: grid;
	grid-template-columns: 1fr 2fr;
	gap: 4rem;
	padding-bottom: 3rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-brand {
	max-width: 280px;
}

.logo {
	display: inline-flex;
	align-items: center;
	text-decoration: none;
	margin-bottom: 1rem;
}

.logo img {
	height: 32px;
	width: auto;
}

.logo-text {
	font-size: 1.5rem;
	font-weight: 700;
	background: linear-gradient(135deg, var(--theme-primary, #0ea5e9) 0%, #6366f1 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.tagline {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.6;
	margin: 0 0 1.5rem;
}

.social-links {
	display: flex;
	gap: 0.75rem;
}

.social-link {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 8px;
	background: rgba(255, 255, 255, 0.1);
	color: rgba(255, 255, 255, 0.8);
	transition: all 0.2s ease;
}

.social-link:hover {
	background: var(--theme-primary, #0ea5e9);
	color: white;
}

.footer-links {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 2rem;
}

.link-column h4 {
	font-size: 0.875rem;
	font-weight: 600;
	color: white;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 1.25rem;
}

.link-column ul {
	list-style: none;
	padding: 0;
	margin: 0;
}

.link-column li {
	margin-bottom: 0.75rem;
}

.link-column a {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.6);
	text-decoration: none;
	transition: color 0.2s ease;
}

.link-column a:hover {
	color: white;
}

.footer-bottom {
	padding-top: 2rem;
	text-align: center;
}

.copyright {
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.5);
	margin: 0;
}

@media (max-width: 968px) {
	.footer-top {
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	.footer-brand {
		max-width: 100%;
		text-align: center;
	}

	.social-links {
		justify-content: center;
	}

	.footer-links {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 640px) {
	.footer-links {
		grid-template-columns: 1fr;
		text-align: center;
	}
}
</style>
