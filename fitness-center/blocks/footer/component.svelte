<script>
let current_year = $state('')

$effect(() => {
	if (typeof window !== 'undefined') {
		current_year = new Date().getFullYear().toString()
	}
})
</script>

<footer class="footer">
	<div class="container">
		<div class="footer-grid">
			<div class="brand">
				<a href="/" class="logo">
					{#if logo?.type === 'image' && logo?.image?.url}
						<img src={logo.image.url} alt={logo.image.alt || logo.text || 'Logo'} />
					{:else if logo?.text}
						<span class="logo-text">{logo.text}</span>
					{:else}
						<span class="logo-text">FitZone</span>
					{/if}
				</a>
				{#if tagline}
					<p class="tagline">{tagline}</p>
				{/if}
				<div class="social-links">
					{#if social_links?.length}
						{#each social_links as social}
							<a href={social.url} aria-label={social.platform} target="_blank" rel="noopener">
								{#if social.platform === 'twitter'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
								{:else if social.platform === 'facebook'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
								{:else if social.platform === 'instagram'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
								{:else if social.platform === 'youtube'}
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
								{/if}
							</a>
						{/each}
					{/if}
				</div>
			</div>

			{#if footer_link_groups?.length}
				{#each footer_link_groups as group}
					<div class="link-group">
						<h4>{group.title}</h4>
						{#if group.links?.length}
							<ul>
								{#each group.links as item}
									{#if item.link?.url && item.link?.label}
										<li><a href={item.link.url}>{item.link.label}</a></li>
									{/if}
								{/each}
							</ul>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<div class="footer-bottom">
			<p>{copyright || `© ${current_year} FitZone. All rights reserved.`}</p>
		</div>
	</div>
</footer>

<style>
.footer {
	background: #000000;
	color: white;
	padding: 4rem 0 2rem;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.footer-grid {
	display: grid;
	grid-template-columns: 2fr repeat(3, 1fr);
	gap: 3rem;
	margin-bottom: 3rem;
}

.brand {
	max-width: 300px;
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
	font-size: 1.75rem;
	font-weight: 800;
	color: var(--theme-primary, #ef4444);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.tagline {
	color: rgba(255, 255, 255, 0.6);
	font-size: 0.9375rem;
	line-height: 1.6;
	margin: 0 0 1.5rem;
}

.social-links {
	display: flex;
	gap: 1rem;
}

.social-links a {
	width: 40px;
	height: 40px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	transition: all 0.2s ease;
}

.social-links a:hover {
	background: var(--theme-primary, #ef4444);
}

.link-group h4 {
	font-size: 0.75rem;
	font-weight: 700;
	color: white;
	margin: 0 0 1.25rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

.link-group ul {
	list-style: none;
	padding: 0;
	margin: 0;
}

.link-group li {
	margin-bottom: 0.75rem;
}

.link-group a {
	color: rgba(255, 255, 255, 0.6);
	text-decoration: none;
	font-size: 0.9375rem;
	transition: color 0.2s ease;
}

.link-group a:hover {
	color: var(--theme-primary, #ef4444);
}

.footer-bottom {
	border-top: 1px solid rgba(255, 255, 255, 0.1);
	padding-top: 2rem;
}

.footer-bottom p {
	color: rgba(255, 255, 255, 0.4);
	font-size: 0.875rem;
	margin: 0;
	text-align: center;
}

@media (max-width: 968px) {
	.footer-grid {
		grid-template-columns: 1fr 1fr;
	}

	.brand {
		grid-column: span 2;
	}
}

@media (max-width: 640px) {
	.footer-grid {
		grid-template-columns: 1fr;
	}

	.brand {
		grid-column: span 1;
	}
}
</style>
