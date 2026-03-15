<script>
	let active_filter = $state('all')

	let categories = $derived(() => {
		if (!items?.length) return []
		const cats = [...new Set(items.map(item => item.category).filter(Boolean))]
		return cats
	})

	let filtered_items = $derived(() => {
		if (!items?.length) return []
		if (active_filter === 'all') return items
		return items.filter(item => item.category === active_filter)
	})

	function set_filter(cat) {
		active_filter = cat
	}
</script>

<section class="gallery" id="gallery">
	<div class="gallery-header">
		{#if title}
			<h2>{title}</h2>
		{/if}
		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}

		{#if categories()?.length > 0}
			<div class="filters">
				<button
					class:active={active_filter === 'all'}
					onclick={() => set_filter('all')}
				>
					All
				</button>
				{#each categories() as cat}
					<button
						class:active={active_filter === cat}
						onclick={() => set_filter(cat)}
					>
						{cat}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if filtered_items()?.length}
		<div class="gallery-grid">
			{#each filtered_items() as item, i}
				<div class="gallery-item" class:wide={item.size === 'wide'} class:tall={item.size === 'tall'}>
					{#if item.image?.url}
						<img src={item.image.url} alt={item.image.alt || item.title} loading="lazy" />
					{/if}
					<div class="item-overlay">
						{#if item.category}
							<span class="item-category">{item.category}</span>
						{/if}
						{#if item.title}
							<h3>{item.title}</h3>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<style>
.gallery {
	padding: var(--theme-section-padding, 8rem) 0;
	background: #0a0a0a;
}

.gallery-header {
	max-width: 1400px;
	margin: 0 auto 4rem;
	padding: 0 2rem;
	text-align: center;
}

h2 {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: clamp(2rem, 5vw, 3.5rem);
	font-weight: 300;
	color: white;
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.125rem;
	color: rgba(255, 255, 255, 0.5);
	margin: 0 0 2.5rem;
	font-weight: 300;
}

.filters {
	display: flex;
	gap: 0.5rem;
	justify-content: center;
	flex-wrap: wrap;
}

.filters button {
	background: transparent;
	border: 1px solid rgba(255, 255, 255, 0.15);
	color: rgba(255, 255, 255, 0.6);
	padding: 0.625rem 1.25rem;
	font-size: 0.75rem;
	font-weight: 500;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	cursor: pointer;
	transition: all 0.3s ease;
}

.filters button:hover {
	border-color: rgba(255, 255, 255, 0.3);
	color: white;
}

.filters button.active {
	background: white;
	border-color: white;
	color: #0a0a0a;
}

.gallery-grid {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 1rem;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1rem;
}

.gallery-item {
	position: relative;
	overflow: hidden;
	aspect-ratio: 1;
	cursor: pointer;
}

.gallery-item.wide {
	grid-column: span 2;
	aspect-ratio: 2;
}

.gallery-item.tall {
	grid-row: span 2;
	aspect-ratio: auto;
}

.gallery-item img {
	width: 100%;
	height: 100%;
	object-fit: cover;
	transition: transform 0.6s ease;
}

.gallery-item:hover img {
	transform: scale(1.05);
}

.item-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 60%);
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	padding: 2rem;
	opacity: 0;
	transition: opacity 0.4s ease;
}

.gallery-item:hover .item-overlay {
	opacity: 1;
}

.item-category {
	font-size: 0.625rem;
	font-weight: 600;
	letter-spacing: 0.15em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.7);
	margin-bottom: 0.5rem;
}

.item-overlay h3 {
	font-family: var(--theme-heading-font, 'Inter', sans-serif);
	font-size: 1.25rem;
	font-weight: 400;
	color: white;
	margin: 0;
}

@media (max-width: 1024px) {
	.gallery-grid {
		grid-template-columns: repeat(2, 1fr);
	}

	.gallery-item.wide {
		grid-column: span 2;
	}
}

@media (max-width: 640px) {
	.gallery-grid {
		grid-template-columns: 1fr;
	}

	.gallery-item.wide,
	.gallery-item.tall {
		grid-column: span 1;
		grid-row: span 1;
		aspect-ratio: 4/3;
	}

	.item-overlay {
		opacity: 1;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 50%);
	}
}
</style>
