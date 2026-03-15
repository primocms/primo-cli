<section class="team" id="team">
	<div class="container">
		<div class="header">
			{#if badge}
				<span class="badge">{badge}</span>
			{/if}
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if members?.length}
			<div class="grid">
				{#each members as member}
					<div class="member-card">
						<div class="photo-wrapper">
							{#if member.photo?.url}
								<img src={member.photo.url} alt={member.photo.alt || member.name} />
							{:else}
								<div class="photo-placeholder">
									<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
								</div>
							{/if}
						</div>
						<div class="info">
							<h3>{member.name}</h3>
							<span class="role">{member.role}</span>
							{#if member.bio}
								<p class="bio">{member.bio}</p>
							{/if}
							<div class="socials">
								{#if member.linkedin}
									<a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
									</a>
								{/if}
								{#if member.twitter}
									<a href={member.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
										<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
									</a>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.team {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background, #ffffff);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.header {
	text-align: center;
	max-width: 700px;
	margin: 0 auto 4rem;
}

.badge {
	display: inline-block;
	background: rgba(249, 115, 22, 0.1);
	color: var(--theme-primary, #f97316);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

h2 {
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
	margin: 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 2rem;
}

.member-card {
	text-align: center;
}

.photo-wrapper {
	position: relative;
	aspect-ratio: 1;
	border-radius: 16px;
	overflow: hidden;
	margin-bottom: 1.5rem;
	background: var(--theme-background-secondary, #f1f5f9);
}

.photo-wrapper img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.4s ease;
}

.member-card:hover .photo-wrapper img {
	transform: scale(1.05);
}

.photo-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--theme-text-muted, #94a3b8);
}

h3 {
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.25rem;
}

.role {
	display: block;
	font-size: 0.875rem;
	color: var(--theme-primary, #f97316);
	font-weight: 500;
	margin-bottom: 0.75rem;
}

.bio {
	font-size: 0.875rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.6;
	margin: 0 0 1rem;
}

.socials {
	display: flex;
	justify-content: center;
	gap: 0.75rem;
}

.socials a {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 8px;
	background: var(--theme-background-secondary, #f1f5f9);
	color: var(--theme-text-muted, #64748b);
	transition: all 0.3s ease;
}

.socials a:hover {
	background: var(--theme-primary, #f97316);
	color: white;
}

@media (max-width: 968px) {
	.grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 480px) {
	.grid {
		grid-template-columns: 1fr;
		max-width: 320px;
		margin: 0 auto;
	}
}
</style>
