<script>
	import Page_0 from './pages/index.svelte'
	import SiteFooter from './blocks/SiteFooter.svelte'

	const routes = {
		'/': Page_0
	}

	let path = $state(get_path())

	function get_path() {
		return window.location.hash.slice(1) || '/'
	}

	function notifyParent(newPath) {
		if (window.parent !== window) {
			window.parent.postMessage({ type: 'pala-navigation', path: newPath }, '*')
		}
	}

	// Intercept link clicks to use hash navigation
	function handleClick(e) {
		const link = e.target.closest('a[href]')
		if (!link) return

		const href = link.getAttribute('href')
		// Only handle internal links
		if (!href || href.startsWith('http') || href.startsWith('mailto:')) return
		// Already a hash link
		if (href.startsWith('#')) return

		e.preventDefault()
		const newPath = href.startsWith('/') ? href : '/' + href
		window.location.hash = newPath
	}

	$effect(() => {
		const handler = () => {
			if (document.startViewTransition) {
				document.startViewTransition(() => {
					path = get_path()
					notifyParent(path)
					window.scrollTo(0, 0)
				})
			} else {
				path = get_path()
				notifyParent(path)
				window.scrollTo(0, 0)
			}
		}
		window.addEventListener('hashchange', handler)
		document.addEventListener('click', handleClick)
		// Notify parent of initial path
		notifyParent(path)
		return () => {
			window.removeEventListener('hashchange', handler)
			document.removeEventListener('click', handleClick)
		}
	})

	let Page = $derived(routes[path] || routes['/'])
</script>



{#if Page}
	<Page />
{:else}
	<p>Page not found: {path}</p>
{/if}

<SiteFooter  />

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
	}
	
</style>
