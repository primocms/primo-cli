<section class="testimonials">
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
		padding: 40px 24px;
		max-width: 1100px;
		margin: 0 auto;
		background: var(--bg, #0B0B0F);
		color: var(--text-primary, #E8E8EC);
		font-family: var(--font-body, 'Plus Jakarta Sans', -apple-system, sans-serif);
	}

	.testimonial-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	.testimonial-card {
		background: var(--bg-elevated, #131318);
		border: 1px solid var(--border, #1f1f28);
		border-radius: 12px;
		padding: 20px;
	}

	.quote {
		color: var(--text-secondary, #9ca3af);
		font-size: 0.9rem;
		line-height: 1.5;
		margin: 0 0 16px;
		font-style: italic;
	}

	.author {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		color: white;
		font-size: 0.75rem;
	}

	.author-name {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.author-role {
		color: var(--text-tertiary, #6b7280);
		font-size: 0.75rem;
	}

	@media (max-width: 900px) {
		.testimonial-grid {
			grid-template-columns: 1fr;
		}
	}
</style>