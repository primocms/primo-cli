<script>
function scroll_to_top() {
	if (typeof window !== 'undefined') {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}
}
</script>

<footer class="footer">
	<div class="container">
		<div class="footer-content">
			<div class="footer-brand">
				<a href="/" class="logo">
					{#if $site?.logo?.type === 'image' && $site.logo.image?.url}
						<img src={$site.logo.image.url} alt={$site.site_name || 'Logo'} />
					{:else}
						<span class="logo-text">{$site?.logo?.text || $site?.site_name || 'JR'}</span>
					{/if}
				</a>

				{#if $site?.footer_text}
					<p class="tagline">{$site.footer_text}</p>
				{/if}
			</div>

			<div class="footer-links">
				{#if $site?.nav_links?.length}
					<nav class="nav-links">
						{#each $site.nav_links as nav_item}
							<a href={nav_item.link?.url}>{nav_item.link?.label}</a>
						{/each}
					</nav>
				{/if}

				{#if $site?.social_links?.length}
					<div class="social-links">
						{#each $site.social_links as social}
							<a href={social.url} class="social-link" target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
								{#if social.platform === 'github'}
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
								{:else if social.platform === 'linkedin'}
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
								{:else if social.platform === 'twitter'}
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
								{:else if social.platform === 'email'}
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
								{:else if social.platform === 'instagram'}
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
								{:else if social.platform === 'youtube'}
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
								{/if}
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="footer-bottom">
			{#if $site?.copyright}
				<p class="copyright">{$site.copyright}</p>
			{/if}

			{#if show_back_to_top}
				<button class="back-to-top" onclick={scroll_to_top} aria-label="Back to top">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
				</button>
			{/if}
		</div>
	</div>
</footer>

<style>
.footer {
	padding: 4rem 0 2rem;
	background: var(--theme-text, #0f172a);
	color: white;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.footer-content {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 3rem;
	padding-bottom: 3rem;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-brand {
	max-width: 300px;
}

.logo {
	display: inline-flex;
	text-decoration: none;
	margin-bottom: 1rem;
}

.logo img {
	height: 32px;
	width: auto;
}

.logo-text {
	font-size: 1.5rem;
	font-weight: 800;
	color: white;
	letter-spacing: -0.03em;
}

.tagline {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.6;
	margin: 0;
}

.footer-links {
	display: flex;
	align-items: center;
	gap: 3rem;
}

.nav-links {
	display: flex;
	gap: 2rem;
}

.nav-links a {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.7);
	text-decoration: none;
	transition: color 0.2s ease;
}

.nav-links a:hover {
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
	border-radius: 10px;
	color: rgba(255, 255, 255, 0.6);
	background: rgba(255, 255, 255, 0.05);
	transition: all 0.2s ease;
}

.social-link:hover {
	color: white;
	background: rgba(255, 255, 255, 0.1);
}

.footer-bottom {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: 2rem;
}

.copyright {
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.5);
	margin: 0;
}

.back-to-top {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.1);
	border: none;
	color: white;
	cursor: pointer;
	transition: all 0.2s ease;
}

.back-to-top:hover {
	background: rgba(255, 255, 255, 0.2);
	transform: translateY(-2px);
}

@media (max-width: 768px) {
	.footer-content {
		flex-direction: column;
		text-align: center;
		align-items: center;
	}

	.footer-brand {
		max-width: 100%;
	}

	.footer-links {
		flex-direction: column;
		gap: 1.5rem;
	}

	.nav-links {
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.5rem;
	}

	.social-links {
		justify-content: center;
	}

	.footer-bottom {
		flex-direction: column;
		gap: 1.5rem;
		text-align: center;
	}
}
</style>
