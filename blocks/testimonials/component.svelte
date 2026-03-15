<section class="testimonials">
	<div class="section-label">{label || 'From the community'}</div>
	<div class="section-title">{title || 'People are building with Pala.'}</div>

	<div class="testimonial-grid">
		{#if items && items.length > 0}
			{#each items as item}
				{#if item}
					<div class="testimonial-card">
						<p class="quote">"{item.quote || ''}"</p>
						<div class="author">
							<div class="avatar">{(item.name || 'A').charAt(0)}</div>
							<div class="author-info">
								<div class="author-name">{item.name || 'Anonymous'}</div>
								<div class="author-role">{item.role || ''}</div>
							</div>
						</div>
					</div>
				{/if}
			{/each}
		{:else}
			<div class="testimonial-card">
				<p class="quote">"I've been looking for something exactly like this — code control without losing the client editing experience. Pala nails it."</p>
				<div class="author">
					<div class="avatar">J</div>
					<div class="author-info">
						<div class="author-name">Placeholder Name</div>
						<div class="author-role">Freelance Developer</div>
					</div>
				</div>
			</div>
			<div class="testimonial-card">
				<p class="quote">"Replaced our entire WordPress setup with a single Pala server. Clients are happier, sites are faster, and I never have to deal with plugin updates again."</p>
				<div class="author">
					<div class="avatar">A</div>
					<div class="author-info">
						<div class="author-name">Placeholder Name</div>
						<div class="author-role">Agency Owner</div>
					</div>
				</div>
			</div>
			<div class="testimonial-card">
				<p class="quote">"The component model just makes sense. Build it once, use it everywhere, and my team can't accidentally break the design."</p>
				<div class="author">
					<div class="avatar">M</div>
					<div class="author-info">
						<div class="author-name">Placeholder Name</div>
						<div class="author-role">Full-Stack Developer</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
.testimonials {
		padding: 80px 24px;
		max-width: 1100px;
		margin: 0 auto;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.section-label {
		text-transform: uppercase;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		color: var(--accent);
		margin-bottom: 16px;
		text-align: center;
	}

	.section-title {
		font-family: var(--font-display);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 600;
		text-align: center;
		margin-bottom: 48px;
	}

	.testimonial-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 24px;
	}

	.testimonial-card {
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 24px;
	}

	.quote {
		color: var(--text-secondary);
		font-size: 1rem;
		line-height: 1.6;
		margin: 0 0 20px;
		font-style: italic;
	}

	.author {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--bg-card);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		color: var(--text-tertiary);
		font-size: 0.9rem;
	}

	.author-name {
		font-weight: 500;
		font-size: 0.95rem;
	}

	.author-role {
		color: var(--text-tertiary);
		font-size: 0.85rem;
	}
</style>