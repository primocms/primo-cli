<section class="contact" id="contact">
	<div class="container">
		<div class="contact-grid">
			<div class="contact-info">
				<div class="section-header">
					<h2>{title}</h2>
					{#if subtitle}
						<p class="subtitle">{subtitle}</p>
					{/if}
				</div>

				<div class="info-blocks">
					<div class="info-block">
						<div class="icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
								<circle cx="12" cy="10" r="3"/>
							</svg>
						</div>
						<div class="info-content">
							<h3>Location</h3>
							<p>{address || "1234 Main Street, Brooklyn, NY 11201"}</p>
						</div>
					</div>

					<div class="info-block">
						<div class="icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="10"/>
								<polyline points="12 6 12 12 16 14"/>
							</svg>
						</div>
						<div class="info-content">
							<h3>Hours</h3>
							{#if hours?.length}
								{#each hours as hour}
									<p>{hour.days}: {hour.time}</p>
								{/each}
							{/if}
						</div>
					</div>

					<div class="info-block">
						<div class="icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
							</svg>
						</div>
						<div class="info-content">
							<h3>Contact</h3>
							{#if phone}
								<p><a href="tel:{phone}">{phone}</a></p>
							{/if}
							{#if email}
								<p><a href="mailto:{email}">{email}</a></p>
							{/if}
						</div>
					</div>
				</div>

				{#if booking_cta?.url}
					<a href={booking_cta.url} class="booking-btn">
						{booking_cta.label}
					</a>
				{/if}
			</div>

			<div class="map-wrapper">
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
						<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
							<circle cx="12" cy="10" r="3"/>
						</svg>
						<p>Map location</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<style>
.contact {
	background: #0a0a0a;
	padding: 6rem 0;
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.contact-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
	align-items: start;
}

.section-header {
	margin-bottom: 3rem;
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
}

.info-blocks {
	display: flex;
	flex-direction: column;
	gap: 2rem;
	margin-bottom: 2.5rem;
}

.info-block {
	display: flex;
	gap: 1.25rem;
}

.icon {
	width: 48px;
	height: 48px;
	background: var(--theme-accent, #C9A86C);
	color: #1a1a1a;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.info-content h3 {
	font-family: var(--theme-heading-font, 'Bebas Neue', Impact, sans-serif);
	font-size: 1.25rem;
	font-weight: 700;
	color: white;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	margin: 0 0 0.5rem;
}

.info-content p {
	font-size: 0.9375rem;
	color: rgba(255, 255, 255, 0.7);
	margin: 0 0 0.25rem;
	line-height: 1.5;
}

.info-content a {
	color: rgba(255, 255, 255, 0.7);
	text-decoration: none;
	transition: color 0.2s ease;
}

.info-content a:hover {
	color: var(--theme-accent, #C9A86C);
}

.booking-btn {
	display: inline-block;
	background: var(--theme-accent, #C9A86C);
	color: #1a1a1a;
	padding: 1rem 2.5rem;
	font-weight: 700;
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	text-decoration: none;
	transition: all 0.3s ease;
}

.booking-btn:hover {
	background: #fff;
}

.map-wrapper {
	aspect-ratio: 1;
	background: #1a1a1a;
	overflow: hidden;
}

.map-wrapper iframe {
	display: block;
}

.map-placeholder {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	color: rgba(255, 255, 255, 0.3);
}

.map-placeholder p {
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.1em;
}

@media (max-width: 768px) {
	.contact-grid {
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	.map-wrapper {
		aspect-ratio: 16/9;
	}
}
</style>
