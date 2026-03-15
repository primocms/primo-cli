<section class="team" id="team">
	<div class="container">
		<div class="section-header">
			<h2>{title}</h2>
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if members?.length}
			<div class="team-grid">
				{#each members as member}
					<div class="team-card">
						<div class="photo-wrapper">
							{#if member.photo?.url}
								<img src={member.photo.url} alt={member.photo.alt || member.name} />
							{:else}
								<div class="photo-placeholder">
									<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
										<circle cx="12" cy="7" r="4"/>
									</svg>
								</div>
							{/if}
						</div>
						<div class="member-info">
							<h3>{member.name}</h3>
							{#if member.role}
								<span class="role">{member.role}</span>
							{/if}
							{#if member.bio}
								<p class="bio">{member.bio}</p>
							{/if}
							{#if member.instagram}
								<a href={member.instagram} class="instagram" target="_blank" rel="noopener">
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
									</svg>
									Follow
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.team {
	background: #111;
	padding: 6rem 0;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.section-header {
	text-align: center;
	margin-bottom: 4rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Bebas Neue', Impact, sans-serif);
	font-size: clamp(2.5rem, 5vw, 3.5rem);
	font-weight: 700;
	color: white;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.6);
	max-width: 500px;
	margin: 0 auto;
}

.team-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 2rem;
}

.team-card {
	background: #1a1a1a;
	overflow: hidden;
	transition: transform 0.3s ease;
}

.team-card:hover {
	transform: translateY(-5px);
}

.photo-wrapper {
	aspect-ratio: 1;
	overflow: hidden;
}

.photo-wrapper img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.5s ease;
}

.team-card:hover .photo-wrapper img {
	transform: scale(1.05);
}

.photo-placeholder {
	width: 100%;
	height: 100%;
	background: #2a2a2a;
	display: flex;
	align-items: center;
	justify-content: center;
	color: rgba(255, 255, 255, 0.3);
}

.member-info {
	padding: 1.5rem;
}

.member-info h3 {
	font-family: var(--theme-heading-font, 'Bebas Neue', Impact, sans-serif);
	font-size: 1.5rem;
	font-weight: 700;
	color: white;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 0.25rem;
}

.role {
	display: block;
	font-size: 0.875rem;
	color: var(--theme-accent, #C9A86C);
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin-bottom: 0.75rem;
}

.bio {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.6;
	margin: 0 0 1rem;
}

.instagram {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	color: rgba(255, 255, 255, 0.6);
	text-decoration: none;
	font-size: 0.875rem;
	transition: color 0.2s ease;
}

.instagram:hover {
	color: var(--theme-accent, #C9A86C);
}
</style>
