<section class="location" id="location">
	<div class="container">
		<div class="header">
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		<div class="location-grid">
			<div class="info-card">
				<div class="info-section">
					<h3>Address</h3>
					<p>{address || "742 Oak Street, Portland, OR 97205"}</p>
				</div>

				<div class="info-section">
					<h3>Hours</h3>
					{#if hours?.length}
						{#each hours as hour}
							<div class="hours-row">
								<span class="days">{hour.days}</span>
								<span class="time">{hour.time}</span>
							</div>
						{/each}
					{:else}
						<div class="hours-row">
							<span class="days">Monday - Friday</span>
							<span class="time">6:00 AM - 7:00 PM</span>
						</div>
						<div class="hours-row">
							<span class="days">Saturday - Sunday</span>
							<span class="time">7:00 AM - 6:00 PM</span>
						</div>
					{/if}
				</div>

				<div class="info-section">
					<h3>Contact</h3>
					{#if phone}
						<p><a href="tel:{phone}">{phone}</a></p>
					{/if}
					{#if email}
						<p><a href="mailto:{email}">{email}</a></p>
					{/if}
				</div>

				{#if cta?.url}
					<a href={cta.url} class="directions-btn" target="_blank" rel="noopener">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polygon points="3 11 22 2 13 21 11 13 3 11"/>
						</svg>
						{cta.label}
					</a>
				{/if}
			</div>

			<div class="map-container">
				{#if map_embed}
					<iframe
						src={map_embed}
						width="100%"
						height="100%"
						style="border:0;"
						allowfullscreen=""
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						title="Location map"
					></iframe>
				{:else}
					<div class="map-placeholder">
						<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
							<circle cx="12" cy="10" r="3"/>
						</svg>
						<p>Map coming soon</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
.location {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background, #FFFAF5);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.header {
	text-align: center;
	margin-bottom: 3rem;
}

h2 {
	font-family: var(--theme-heading-font, 'Cormorant Garamond', Georgia, serif);
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 600;
	color: var(--theme-text, #2C1810);
	margin: 0 0 1rem;
}

.subtitle {
	font-size: 1.125rem;
	color: var(--theme-text-muted, #6B5B4F);
	line-height: 1.6;
	margin: 0;
}

.location-grid {
	display: grid;
	grid-template-columns: 400px 1fr;
	gap: 2rem;
	min-height: 400px;
}

.info-card {
	background: var(--theme-background-secondary, #F5EBE0);
	border-radius: 12px;
	padding: 2rem;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.info-section h3 {
	font-family: var(--theme-heading-font, 'Cormorant Garamond', Georgia, serif);
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--theme-primary, #8B4513);
	margin: 0 0 0.75rem;
}

.info-section p {
	color: var(--theme-text, #2C1810);
	margin: 0;
	line-height: 1.6;
}

.info-section a {
	color: var(--theme-text, #2C1810);
	text-decoration: none;
	transition: color 0.2s ease;
}

.info-section a:hover {
	color: var(--theme-primary, #8B4513);
}

.hours-row {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.5rem 0;
	border-bottom: 1px solid var(--theme-border-color, #E8DDD4);
}

.hours-row:last-child {
	border-bottom: none;
}

.days {
	color: var(--theme-text, #2C1810);
	font-weight: 500;
}

.time {
	color: var(--theme-text-muted, #6B5B4F);
}

.directions-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	background: var(--theme-primary, #8B4513);
	color: white;
	padding: 1rem 1.5rem;
	border-radius: 6px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.2s ease;
	margin-top: auto;
}

.directions-btn:hover {
	background: var(--theme-primary-dark, #654321);
	transform: translateY(-2px);
}

.map-container {
	border-radius: 12px;
	overflow: hidden;
	background: var(--theme-background-secondary, #F5EBE0);
}

.map-container iframe {
	display: block;
}

.map-placeholder {
	width: 100%;
	height: 100%;
	min-height: 300px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	color: var(--theme-text-muted, #6B5B4F);
}

.map-placeholder p {
	margin: 0;
}

@media (max-width: 968px) {
	.location-grid {
		grid-template-columns: 1fr;
	}

	.map-container {
		min-height: 300px;
	}
}
</style>
