<section class="page-header">
	<div class="header-bg">
		<div class="header-gradient"></div>
		<div class="header-pattern"></div>
	</div>
	<div class="container">
		{#if title}
			<h1>{title}</h1>
		{/if}
		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}
	</div>
</section>

<style>
.page-header {
	position: relative;
	padding: 10rem 0 4rem;
	overflow: hidden;
}

.header-bg {
	position: absolute;
	inset: 0;
	z-index: 0;
}

.header-gradient {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
}

.header-pattern {
	position: absolute;
	inset: 0;
	background-image: radial-gradient(rgba(99, 102, 241, 0.15) 1px, transparent 1px);
	background-size: 40px 40px;
	mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
}

.container {
	position: relative;
	z-index: 1;
	max-width: 900px;
	margin: 0 auto;
	padding: 0 1.5rem;
	text-align: center;
}

h1 {
	font-size: clamp(2.5rem, 5vw, 3.5rem);
	font-weight: 800;
	color: white;
	margin: 0 0 1rem;
	letter-spacing: -0.02em;
}

.subtitle {
	font-size: 1.25rem;
	color: #94a3b8;
	line-height: 1.7;
	margin: 0;
	max-width: 700px;
	margin-left: auto;
	margin-right: auto;
}
</style>