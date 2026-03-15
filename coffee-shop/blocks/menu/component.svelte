<section class="menu" id="menu">
	<div class="container">
		<div class="header">
			{#if title}
				<h2>{title}</h2>
			{/if}
			{#if subtitle}
				<p class="subtitle">{subtitle}</p>
			{/if}
		</div>

		{#if categories?.length}
			<div class="menu-grid">
				{#each categories as category}
					<div class="menu-category">
						<h3 class="category-title">{category.name}</h3>
						{#if category.items?.length}
							<div class="menu-items">
								{#each category.items as item}
									<div class="menu-item">
										<div class="item-header">
											<span class="item-name">{item.item_name}</span>
											<span class="item-dots"></span>
											<span class="item-price">{item.price}</span>
										</div>
										{#if item.description}
											<p class="item-description">{item.description}</p>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
.menu {
	padding: var(--theme-section-padding, 5rem) 0;
	background: var(--theme-background, #FFFAF5);
}

.container {
	max-width: 1000px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.header {
	text-align: center;
	margin-bottom: 4rem;
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
	max-width: 500px;
	margin: 0 auto;
}

.menu-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 3rem;
}

.menu-category {
	background: var(--theme-background-secondary, #F5EBE0);
	border-radius: 12px;
	padding: 2rem;
}

.category-title {
	font-family: var(--theme-heading-font, 'Cormorant Garamond', Georgia, serif);
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--theme-primary, #8B4513);
	margin: 0 0 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid var(--theme-border-color, #E8DDD4);
}

.menu-items {
	display: flex;
	flex-direction: column;
	gap: 1.25rem;
}

.menu-item {
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--theme-border-color, #E8DDD4);
}

.menu-item:last-child {
	padding-bottom: 0;
	border-bottom: none;
}

.item-header {
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
	margin-bottom: 0.25rem;
}

.item-name {
	font-weight: 600;
	color: var(--theme-text, #2C1810);
	font-size: 1rem;
}

.item-dots {
	flex: 1;
	border-bottom: 2px dotted var(--theme-border-color, #E8DDD4);
	min-width: 20px;
}

.item-price {
	font-weight: 600;
	color: var(--theme-primary, #8B4513);
	font-size: 1rem;
}

.item-description {
	font-size: 0.875rem;
	color: var(--theme-text-muted, #6B5B4F);
	margin: 0;
	line-height: 1.5;
}

@media (max-width: 640px) {
	.menu-grid {
		grid-template-columns: 1fr;
	}

	.menu-category {
		padding: 1.5rem;
	}
}
</style>
