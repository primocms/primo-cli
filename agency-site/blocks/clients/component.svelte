<section class="clients">
	<div class="container">
		{#if title}
			<p class="title">{title}</p>
		{/if}

		{#if clients?.length}
			<div class="logos">
				{#each clients as client}
					<div class="logo-item">
						{#if client.logo?.url}
							<img src={client.logo.url} alt={client.logo.alt || client.name} />
						{:else}
							<span class="logo-text">{client.name}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.clients {
	padding: 4rem 0;
	background: var(--theme-background-secondary, #f8fafc);
	border-top: 1px solid var(--theme-border-color, #e2e8f0);
	border-bottom: 1px solid var(--theme-border-color, #e2e8f0);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.title {
	text-align: center;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--theme-text-muted, #64748b);
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin: 0 0 2rem;
}

.logos {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
	gap: 3rem;
}

.logo-item {
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0.6;
	transition: opacity 0.3s ease;
}

.logo-item:hover {
	opacity: 1;
}

.logo-item img {
	max-height: 40px;
	max-width: 140px;
	object-fit: contain;
	filter: grayscale(100%);
	transition: filter 0.3s ease;
}

.logo-item:hover img {
	filter: grayscale(0%);
}

.logo-text {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	letter-spacing: -0.02em;
}

@media (max-width: 768px) {
	.logos {
		gap: 2rem;
	}

	.logo-item img {
		max-height: 32px;
		max-width: 100px;
	}
}
</style>
