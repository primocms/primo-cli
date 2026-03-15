<footer class="footer">
	<div class="footer-container">
		<div class="footer-main">
			<a href="/" class="footer-logo">
				{#if site?.logo?.type === 'image' && site?.logo?.image?.url}
					<img src={site.logo.image.url} alt={site.logo.image.alt || site.site_name} />
				{:else}
					<span>{site?.logo?.text || site?.site_name || 'LUMEN'}</span>
				{/if}
			</a>

			{#if site?.tagline}
				<p class="footer-tagline">{site.tagline}</p>
			{/if}
		</div>

		<div class="footer-links">
			{#if site?.nav_links?.length}
				<nav class="footer-nav">
					{#each site.nav_links as nav_item}
						{#if nav_item.link?.url}
							<a href={nav_item.link.url}>{nav_item.link.label}</a>
						{/if}
					{/each}
				</nav>
			{/if}
		</div>

		<div class="footer-social">
			{#if site?.social_links?.length}
				{#each site.social_links as social}
					<a href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
						{#if social.platform === 'instagram'}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
								<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
								<line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
							</svg>
						{:else if social.platform === 'behance'}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zM3 11h3.584c2.508 0 2.906-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z"/>
							</svg>
						{:else if social.platform === 'pinterest'}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
							</svg>
						{:else if social.platform === 'linkedin'}
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
								<rect width="4" height="12" x="2" y="9"/>
								<circle cx="4" cy="4" r="2"/>
							</svg>
						{/if}
					</a>
				{/each}
			{/if}
		</div>
	</div>

	<div class="footer-bottom">
		<div class="footer-container">
			{#if site?.copyright}
				<p class="copyright">&copy; {site.copyright}</p>
			{/if}
		</div>
	</div>
</footer>

<style>
.footer {
	background: #050505;
	padding-top: 5rem;
}

.footer-container {
	max-width: 1400px;
	margin: 0 auto;
	padding: 0 2rem;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 4rem;
}

.footer-main {
	max-width: 300px;
}

.footer-logo {
	display: inline-block;
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: 1.25rem;
	font-weight: 700;
	color: white;
	text-decoration: none;
	letter-spacing: 0.2em;
	text-transform: uppercase;
	margin-bottom: 1rem;
}

.footer-logo img {
	height: 32px;
	width: auto;
}

.footer-tagline {
	font-size: 0.875rem;
	color: rgba(255, 255, 255, 0.4);
	line-height: 1.6;
	margin: 0;
}

.footer-nav {
	display: flex;
	gap: 2rem;
}

.footer-nav a {
	color: rgba(255, 255, 255, 0.6);
	text-decoration: none;
	font-size: 0.8125rem;
	font-weight: 500;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	transition: color 0.3s ease;
}

.footer-nav a:hover {
	color: white;
}

.footer-social {
	display: flex;
	gap: 1rem;
}

.footer-social a {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	color: rgba(255, 255, 255, 0.5);
	border: 1px solid rgba(255, 255, 255, 0.1);
	transition: all 0.3s ease;
}

.footer-social a:hover {
	color: white;
	border-color: rgba(255, 255, 255, 0.3);
}

.footer-bottom {
	margin-top: 4rem;
	padding: 1.5rem 0;
	border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.footer-bottom .footer-container {
	display: block;
}

.copyright {
	font-size: 0.75rem;
	color: rgba(255, 255, 255, 0.3);
	margin: 0;
	text-align: center;
}

@media (max-width: 900px) {
	.footer-container {
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.footer-main {
		max-width: 100%;
	}

	.footer-nav {
		flex-wrap: wrap;
		justify-content: center;
	}
}

@media (max-width: 640px) {
	.footer-nav {
		gap: 1.5rem;
	}
}
</style>
