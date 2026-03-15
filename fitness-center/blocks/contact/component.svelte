<section class="contact-section" id="contact">
	<div class="container">
		<div class="header">
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		<div class="contact-grid">
			<div class="contact-info">
				{#if address}
					<div class="info-item">
						<div class="info-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
						</div>
						<div class="info-content">
							<h4>Location</h4>
							<p>{address}</p>
						</div>
					</div>
				{/if}

				{#if phone}
					<div class="info-item">
						<div class="info-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
						</div>
						<div class="info-content">
							<h4>Phone</h4>
							<p><a href="tel:{phone}">{phone}</a></p>
						</div>
					</div>
				{/if}

				{#if email}
					<div class="info-item">
						<div class="info-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
						</div>
						<div class="info-content">
							<h4>Email</h4>
							<p><a href="mailto:{email}">{email}</a></p>
						</div>
					</div>
				{/if}

				{#if hours?.length}
					<div class="info-item hours-item">
						<div class="info-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
						</div>
						<div class="info-content">
							<h4>Hours</h4>
							<ul class="hours-list">
								{#each hours as hour}
									<li>
										<span class="day">{hour.day}</span>
										<span class="time">{hour.time}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}
			</div>

			<div class="map-placeholder">
				<div class="map-content">
					<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
					<p>Visit us at our location</p>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
.contact-section {
	padding: var(--theme-section-padding, 6rem) 0;
	background: var(--theme-background-secondary, #0f172a);
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

h2 {
	font-size: clamp(2rem, 4vw, 3rem);
	font-weight: 900;
	color: white;
	margin: 0 0 1rem;
	text-transform: uppercase;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.7);
	line-height: 1.7;
	margin: 0;
}

.contact-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4rem;
}

.contact-info {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.info-item {
	display: flex;
	gap: 1.25rem;
}

.info-icon {
	width: 48px;
	height: 48px;
	background: var(--theme-primary, #ef4444);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;
}

.info-content h4 {
	font-size: 0.75rem;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.5);
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin: 0 0 0.5rem;
}

.info-content p {
	font-size: 1.0625rem;
	color: white;
	margin: 0;
	line-height: 1.6;
}

.info-content a {
	color: white;
	text-decoration: none;
	transition: color 0.2s ease;
}

.info-content a:hover {
	color: var(--theme-primary, #ef4444);
}

.hours-list {
	list-style: none;
	padding: 0;
	margin: 0;
}

.hours-list li {
	display: flex;
	justify-content: space-between;
	padding: 0.375rem 0;
	font-size: 0.9375rem;
}

.hours-list .day {
	color: rgba(255, 255, 255, 0.7);
}

.hours-list .time {
	color: white;
	font-weight: 600;
}

.map-placeholder {
	background: rgba(255, 255, 255, 0.05);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 400px;
}

.map-content {
	text-align: center;
	color: rgba(255, 255, 255, 0.3);
}

.map-content svg {
	margin-bottom: 1rem;
}

.map-content p {
	font-size: 1rem;
	margin: 0;
}

@media (max-width: 768px) {
	.contact-grid {
		grid-template-columns: 1fr;
		gap: 3rem;
	}

	.map-placeholder {
		min-height: 300px;
	}
}
</style>
