<section class="team">
	<div class="container">
		<div class="header">
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
						{#if member.photo?.url}
							<img src={member.photo.url} alt={member.name} class="photo" />
						{:else}
							<div class="photo-placeholder">
								{member.name?.charAt(0) || '?'}
							</div>
						{/if}
						<h3>{member.name}</h3>
						<p class="role">{member.role}</p>
						{#if member.bio}
							<p class="bio">{member.bio}</p>
						{/if}
						{#if member.linkedin}
							<a href={member.linkedin} class="linkedin" target="_blank" rel="noopener" aria-label="LinkedIn">
								<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
							</a>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.team {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #f8fafc);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.header {
	text-align: center;
	margin-bottom: 4rem;
}

h2 {
	font-size: clamp(2rem, 4vw, 2.75rem);
	font-weight: 800;
	color: var(--theme-text, #0f172a);
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #64748b);
	margin: 0;
}

.grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 2rem;
}

.member-card {
	background: white;
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 2rem;
	text-align: center;
}

.photo {
	width: 120px;
	height: 120px;
	border-radius: 50%;
	object-fit: cover;
	margin-bottom: 1.5rem;
}

.photo-placeholder {
	width: 120px;
	height: 120px;
	border-radius: 50%;
	background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 2.5rem;
	font-weight: 700;
	margin: 0 auto 1.5rem;
}

h3 {
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.25rem;
}

.role {
	font-size: 0.9375rem;
	color: var(--theme-primary, #6366f1);
	font-weight: 500;
	margin: 0 0 0.75rem;
}

.bio {
	font-size: 0.875rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.6;
	margin: 0 0 1rem;
}

.linkedin {
	color: var(--theme-text-muted, #64748b);
	transition: color 0.2s ease;
}

.linkedin:hover {
	color: #0077b5;
}

@media (max-width: 968px) {
	.grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 640px) {
	.grid {
		grid-template-columns: 1fr;
	}
}
</style>