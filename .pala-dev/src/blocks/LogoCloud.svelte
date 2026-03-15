<section class="logo-cloud">
	<div class="container">
		{#if title}
			<p class="title">{title}</p>
		{/if}

		{#if logos?.length}
			<div class="logos">
				{#each (logos || []) as logo}
					<div class="logo-item">
						{#if logo?.image?.url}
							<img src={logo?.image?.url} alt={logo?.name || logo?.image?.alt || 'Company logo'} />
						{:else}
							<span class="logo-placeholder">{logo?.name || 'Logo'}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<script>
	let { title = '', logos = [], image = {}, name = '' } = $props()
</script>

<style>
.logo-cloud {
	padding: 4rem 0;
	background: var(--theme-background, #ffffff);
	border-bottom: 1px solid var(--theme-border-color, #e2e8f0);
}

.container {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.title {
	text-align: center;
	color: var(--theme-text-muted, #64748b);
	font-size: 0.875rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.1em;
	margin: 0 0 2rem;
}

.logos {
	display: flex;
	align-items: center;
	justify-content: center;
	flex-wrap: wrap;
	gap: 3rem;
}

.logo-item {
	display: flex;
	align-items: center;
	justify-content: center;
}

.logo-item img {
	height: 32px;
	width: auto;
	max-width: 140px;
	object-fit: contain;
	filter: grayscale(100%);
	opacity: 0.6;
	transition: all 0.3s ease;
}

.logo-item:hover img {
	filter: grayscale(0%);
	opacity: 1;
}

.logo-placeholder {
	font-size: 1.25rem;
	font-weight: 700;
	color: var(--theme-text-muted, #64748b);
	opacity: 0.5;
}

@media (max-width: 768px) {
	.logos {
		gap: 2rem;
	}

	.logo-item img {
		height: 24px;
		max-width: 100px;
	}
}
</style>
