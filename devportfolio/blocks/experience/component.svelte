<section class="experience" id="experience">
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

		{#if jobs?.length}
			<div class="timeline">
				{#each jobs as job, index}
					<div class="timeline-item" class:current={job.is_current}>
						<div class="timeline-marker">
							<div class="marker-dot"></div>
							{#if index < jobs.length - 1}
								<div class="marker-line"></div>
							{/if}
						</div>

						<div class="timeline-content">
							<div class="job-header">
								{#if job.logo?.url}
									<div class="company-logo">
										<img src={job.logo.url} alt={job.company} />
									</div>
								{/if}
								<div class="job-meta">
									<h3>{job.role}</h3>
									<p class="company">{job.company}</p>
									<span class="period">
										{job.period}
										{#if job.is_current}
											<span class="current-badge">Current</span>
										{/if}
									</span>
								</div>
							</div>

							{#if job.description}
								<div class="job-description">
									{@html job.description}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.experience {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #f8fafc);
}

.container {
	max-width: 900px;
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
	background: rgba(99, 102, 241, 0.1);
	color: var(--theme-primary, #6366f1);
	padding: 0.5rem 1rem;
	border-radius: 50px;
	font-size: 0.875rem;
	font-weight: 600;
	margin-bottom: 1rem;
}

h2 {
	font-size: clamp(2rem, 4vw, 2.75rem);
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

.timeline {
	display: flex;
	flex-direction: column;
}

.timeline-item {
	display: flex;
	gap: 2rem;
}

.timeline-marker {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-shrink: 0;
}

.marker-dot {
	width: 16px;
	height: 16px;
	background: var(--theme-background, #ffffff);
	border: 3px solid var(--theme-border-color, #e2e8f0);
	border-radius: 50%;
	transition: all 0.3s ease;
}

.timeline-item.current .marker-dot {
	border-color: var(--theme-primary, #6366f1);
	background: var(--theme-primary, #6366f1);
	box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
}

.marker-line {
	width: 2px;
	flex: 1;
	background: var(--theme-border-color, #e2e8f0);
	margin-top: 0.5rem;
}

.timeline-content {
	flex: 1;
	background: var(--theme-background, #ffffff);
	border: 1px solid var(--theme-border-color, #e2e8f0);
	border-radius: 16px;
	padding: 1.5rem;
	margin-bottom: 2rem;
	transition: all 0.3s ease;
}

.timeline-content:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.timeline-item.current .timeline-content {
	border-color: var(--theme-primary, #6366f1);
}

.job-header {
	display: flex;
	gap: 1rem;
	align-items: flex-start;
}

.company-logo {
	width: 48px;
	height: 48px;
	border-radius: 10px;
	overflow: hidden;
	flex-shrink: 0;
	background: var(--theme-background-secondary, #f8fafc);
}

.company-logo img {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.job-meta {
	flex: 1;
}

h3 {
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 0 0 0.25rem;
}

.company {
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	margin: 0 0 0.5rem;
}

.period {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.8125rem;
	color: var(--theme-text-muted, #64748b);
}

.current-badge {
	background: rgba(34, 197, 94, 0.1);
	color: #16a34a;
	padding: 0.125rem 0.5rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 600;
}

.job-description {
	margin-top: 1rem;
	padding-top: 1rem;
	border-top: 1px solid var(--theme-border-color, #e2e8f0);
	font-size: 0.9375rem;
	color: var(--theme-text-muted, #64748b);
	line-height: 1.7;
}

.job-description :global(ul) {
	margin: 0;
	padding-left: 1.25rem;
}

.job-description :global(li) {
	margin-bottom: 0.5rem;
}

.job-description :global(li:last-child) {
	margin-bottom: 0;
}

@media (max-width: 640px) {
	.timeline-item {
		gap: 1rem;
	}

	.job-header {
		flex-direction: column;
	}
}
</style>
