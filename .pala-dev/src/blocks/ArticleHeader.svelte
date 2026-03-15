<section class="article-header">
	<div class="header-bg">
		<div class="header-gradient"></div>
	</div>
	<div class="container">
		<div class="meta">
			{#if date}
				<span class="date">{date}</span>
			{/if}
			{#if author}
				<span class="author">by {author}</span>
			{/if}
		</div>
		{#if title}
			<h1>{title}</h1>
		{/if}
		{#if excerpt}
			<p class="excerpt">{excerpt}</p>
		{/if}
	</div>
	{#if image?.url}
		<div class="featured-image">
			<img src={image?.url} alt={image?.alt || title} />
		</div>
	{/if}
</section>

<script>
	let { title = '', excerpt = '', author = '', date = '', image = {} } = $props()
</script>

<style>
.article-header {
	position: relative;
	padding: 10rem 0 0;
	overflow: hidden;
}

.header-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 60%;
	z-index: 0;
}

.header-gradient {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
}

.container {
	position: relative;
	z-index: 1;
	max-width: 800px;
	margin: 0 auto;
	padding: 0 1.5rem 3rem;
	text-align: center;
}

.meta {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
	font-size: 0.9375rem;
	color: #94a3b8;
}

.date {
	background: rgba(99, 102, 241, 0.2);
	padding: 0.375rem 0.75rem;
	border-radius: 50px;
}

h1 {
	font-size: clamp(2rem, 5vw, 3rem);
	font-weight: 800;
	color: white;
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
	line-height: 1.2;
}

.excerpt {
	font-size: 1.25rem;
	color: #94a3b8;
	line-height: 1.7;
	margin: 0;
}

.featured-image {
	position: relative;
	z-index: 1;
	max-width: 900px;
	margin: 0 auto;
	padding: 0 1.5rem;
}

.featured-image img {
	width: 100%;
	height: auto;
	border-radius: 16px;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}
</style>
