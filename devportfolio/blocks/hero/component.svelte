<section class="hero">
	<div class="hero-bg">
		<div class="gradient-orb orb-1"></div>
		<div class="gradient-orb orb-2"></div>
		<div class="grid-pattern"></div>
	</div>

	<div class="hero-container">
		<div class="hero-content">
			{#if greeting}
				<span class="greeting">{greeting}</span>
			{/if}

			<h1>
				{#if name}
					<span class="name">{name}</span>
				{/if}
			</h1>

			{#if role}
				<p class="role">{role}</p>
			{/if}

			{#if tagline}
				<p class="tagline">{tagline}</p>
			{/if}

			<div class="cta-group">
				{#if primary_cta?.url}
					<a href={primary_cta.url} class="btn-primary">
						{primary_cta.label}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
					</a>
				{/if}
				{#if secondary_cta?.url}
					<a href={secondary_cta.url} class="btn-secondary">
						{secondary_cta.label}
					</a>
				{/if}
			</div>

			{#if show_socials && $site?.social_links?.length}
				<div class="social-links">
					{#each $site.social_links as social}
						<a href={social.url} class="social-link" target="_blank" rel="noopener noreferrer" aria-label={social.platform}>
							{#if social.platform === 'github'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
							{:else if social.platform === 'linkedin'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
							{:else if social.platform === 'twitter'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
							{:else if social.platform === 'email'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
							{:else if social.platform === 'dribbble'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.628 0-12 5.373-12 12s5.372 12 12 12 12-5.373 12-12-5.372-12-12-12zm9.885 11.441c-2.575-.422-4.943-.445-7.103-.073-.244-.563-.497-1.125-.767-1.68 2.31-1 4.165-2.358 5.548-4.082 1.35 1.594 2.197 3.619 2.322 5.835zm-3.842-7.282c-1.205 1.554-2.868 2.783-4.986 3.68-1.016-1.861-2.178-3.676-3.488-5.438.779-.197 1.591-.314 2.431-.314 2.275 0 4.368.779 6.043 2.072zm-10.516-.993c1.331 1.742 2.511 3.538 3.537 5.381-2.43.715-5.331 1.082-8.684 1.105.692-2.835 2.601-5.193 5.147-6.486zm-5.44 8.834l.013-.256c3.849-.005 7.169-.448 9.95-1.322.233.475.456.952.67 1.432-3.38 1.057-6.165 3.222-8.337 6.48-1.432-1.719-2.296-3.927-2.296-6.334zm3.829 7.81c1.969-3.088 4.482-5.098 7.598-6.027.928 2.42 1.609 4.91 2.043 7.46-3.349 1.291-6.953.666-9.641-1.433zm11.586.43c-.438-2.353-1.08-4.653-1.92-6.897 1.876-.265 3.94-.196 6.199.196-.437 2.786-2.028 5.192-4.279 6.701z"/></svg>
							{:else if social.platform === 'codepen'}
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/><polyline points="2 15.5 12 8.5 22 15.5"/><line x1="12" y1="2" x2="12" y2="8.5"/></svg>
							{/if}
						</a>
					{/each}
				</div>
			{/if}
		</div>

		{#if profile_image?.url}
			<div class="hero-image">
				<div class="image-glow"></div>
				<img src={profile_image.url} alt={name || 'Profile'} />
			</div>
		{/if}
	</div>
</section>

<style>
.hero {
	position: relative;
	min-height: 100vh;
	display: flex;
	align-items: center;
	padding: 8rem 0 4rem;
	overflow: hidden;
}

.hero-bg {
	position: absolute;
	inset: 0;
	background: #0f172a;
}

.gradient-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(80px);
	opacity: 0.6;
}

.orb-1 {
	width: 600px;
	height: 600px;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	top: -200px;
	right: -200px;
}

.orb-2 {
	width: 400px;
	height: 400px;
	background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
	bottom: -100px;
	left: -100px;
}

.grid-pattern {
	position: absolute;
	inset: 0;
	background-image:
		linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
		linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
	background-size: 60px 60px;
}

.hero-container {
	position: relative;
	z-index: 1;
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	align-items: center;
}

.hero-content {
	max-width: 600px;
}

.greeting {
	display: inline-block;
	color: #a5b4fc;
	font-size: 1.125rem;
	font-weight: 500;
	margin-bottom: 1rem;
}

h1 {
	font-size: clamp(3rem, 6vw, 4.5rem);
	font-weight: 800;
	color: white;
	line-height: 1.1;
	margin: 0 0 1rem;
	letter-spacing: -0.03em;
}

.name {
	background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.role {
	font-size: 1.5rem;
	font-weight: 600;
	color: #6366f1;
	margin: 0 0 1rem;
}

.tagline {
	font-size: 1.25rem;
	color: #94a3b8;
	line-height: 1.7;
	margin: 0 0 2rem;
}

.cta-group {
	display: flex;
	gap: 1rem;
	flex-wrap: wrap;
	margin-bottom: 2rem;
}

.btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	padding: 1rem 2rem;
	border-radius: 12px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.3s ease;
	box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.btn-primary:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
}

.btn-primary svg {
	transition: transform 0.3s ease;
}

.btn-primary:hover svg {
	transform: translateX(4px);
}

.btn-secondary {
	display: inline-flex;
	align-items: center;
	background: transparent;
	color: white;
	padding: 1rem 2rem;
	border-radius: 12px;
	font-weight: 600;
	text-decoration: none;
	border: 1px solid rgba(255, 255, 255, 0.2);
	transition: all 0.3s ease;
}

.btn-secondary:hover {
	background: rgba(255, 255, 255, 0.1);
	border-color: rgba(255, 255, 255, 0.3);
}

.social-links {
	display: flex;
	gap: 1rem;
}

.social-link {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	color: #94a3b8;
	transition: all 0.3s ease;
}

.social-link:hover {
	background: rgba(99, 102, 241, 0.2);
	border-color: #6366f1;
	color: white;
	transform: translateY(-2px);
}

.hero-image {
	position: relative;
	display: flex;
	justify-content: center;
}

.image-glow {
	position: absolute;
	inset: -20%;
	background: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
	z-index: 0;
}

.hero-image img {
	position: relative;
	z-index: 1;
	width: 100%;
	max-width: 400px;
	height: auto;
	border-radius: 24px;
	border: 2px solid rgba(255, 255, 255, 0.1);
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

@media (max-width: 968px) {
	.hero-container {
		grid-template-columns: 1fr;
		text-align: center;
	}

	.hero-content {
		margin: 0 auto;
		order: 2;
	}

	.hero-image {
		order: 1;
	}

	.hero-image img {
		max-width: 280px;
	}

	.cta-group {
		justify-content: center;
	}

	.social-links {
		justify-content: center;
	}
}

@media (max-width: 640px) {
	.hero {
		padding: 7rem 0 3rem;
	}

	.cta-group {
		flex-direction: column;
	}

	.btn-primary,
	.btn-secondary {
		width: 100%;
		justify-content: center;
	}
}
</style>
