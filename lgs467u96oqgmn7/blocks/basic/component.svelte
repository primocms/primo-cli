<section class="basic-content">
	<div class="container">
		{#if content}
			<div class="prose">
				{@html content}
			</div>
		{/if}
	</div>
</section>

<style>
.basic-content {
	padding: var(--theme-section-padding, 4rem) 0;
	background: var(--theme-background, #ffffff);
}

.container {
	max-width: 800px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.prose {
	color: var(--theme-text, #1e293b);
	font-size: 1.0625rem;
	line-height: 1.8;
}

.prose :global(h2) {
	font-size: 1.75rem;
	font-weight: 700;
	color: var(--theme-text, #0f172a);
	margin: 2.5rem 0 1rem;
}

.prose :global(h2:first-child) {
	margin-top: 0;
}

.prose :global(h3) {
	font-size: 1.25rem;
	font-weight: 600;
	color: var(--theme-text, #0f172a);
	margin: 2rem 0 0.75rem;
}

.prose :global(p) {
	margin: 0 0 1.25rem;
}

.prose :global(ul),
.prose :global(ol) {
	margin: 0 0 1.25rem;
	padding-left: 1.5rem;
}

.prose :global(li) {
	margin-bottom: 0.5rem;
}

.prose :global(a) {
	color: var(--theme-primary, #6366f1);
	text-decoration: underline;
}

.prose :global(a:hover) {
	color: var(--theme-primary-dark, #4f46e5);
}

.prose :global(blockquote) {
	border-left: 4px solid var(--theme-primary, #6366f1);
	padding-left: 1.5rem;
	margin: 1.5rem 0;
	font-style: italic;
	color: var(--theme-text-muted, #64748b);
}
</style>
