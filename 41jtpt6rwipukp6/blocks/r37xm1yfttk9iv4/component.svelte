<script>
import {fade} from 'svelte/transition'

let mobile_nav_open = $state(false)
let scrolled = $state(false)
let is_editor = $state(false)

if (typeof window !== 'undefined') {
  // Detect if we're in the CMS editor
  is_editor = window.__PALA_CONTEXT__?.environment === 'editor'
  $effect(() => {
    const handle_scroll = () => {
      scrolled = window.scrollY > 50
    }
    handle_scroll()
    window.addEventListener('scroll', handle_scroll)
    return () => window.removeEventListener('scroll', handle_scroll)
  })
}
</script>

<header class:scrolled class:in-editor={is_editor}>
  <div class="header-container">
    <a href="/" class="logo">
      {#if logo?.type === 'text'}
        <span class="logo-text">{logo.text}</span>
      {:else if logo?.image?.url}
        <img src={logo.image.url} alt={logo.image.alt || 'Logo'} />
      {:else}
        <span class="logo-text">Northstar</span>
      {/if}
    </a>

    <nav class="desktop-nav">
      {#each site_navigation_links || [] as item}
        <a class="nav-link" href={item.link.url}>{item.link.label}</a>
      {/each}
    </nav>

    {#if cta?.url}
      <a href={cta.url} class="cta-btn">{cta.label}</a>
    {/if}

    <button
      class="mobile-toggle"
      onclick={() => mobile_nav_open = true}
      aria-label="Open menu">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</header>

{#if mobile_nav_open}
  <div class="mobile-overlay" transition:fade={{ duration: 200 }}>
    <div class="mobile-header">
      <a href="/" class="logo" onclick={() => mobile_nav_open = false}>
        <span class="logo-text">{logo?.text || 'Northstar'}</span>
      </a>
      <button
        class="close-btn"
        onclick={() => mobile_nav_open = false}
        aria-label="Close menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <nav class="mobile-nav">
      {#each site_navigation_links || [] as item}
        <a href={item.link.url} onclick={() => mobile_nav_open = false}>{item.link.label}</a>
      {/each}
    </nav>
    {#if cta?.url}
      <div class="mobile-footer">
        <a href={cta.url} class="mobile-cta" onclick={() => mobile_nav_open = false}>{cta.label}</a>
      </div>
    {/if}
  </div>
{/if}

<style>
header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 1.25rem 2rem;
  transition: all 0.3s ease;
}

header.scrolled {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  padding: 1rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* In CMS editor: use relative instead of fixed so it flows normally */
header.in-editor {
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  text-decoration: none;
  z-index: 10;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.02em;
  transition: color 0.3s;
}

header.scrolled .logo-text {
  color: #0f172a;
}

.logo img {
  height: 36px;
  width: auto;
}

.desktop-nav {
  display: none;
  align-items: center;
  gap: 2.5rem;
}

@media (min-width: 900px) {
  .desktop-nav {
    display: flex;
  }
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: color 0.2s;
}

header.scrolled .nav-link {
  color: #475569;
}

.nav-link:hover {
  color: #a5b4fc;
}

header.scrolled .nav-link:hover {
  color: #6366f1;
}

.cta-btn {
  display: none;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 50px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

@media (min-width: 900px) {
  .cta-btn {
    display: inline-block;
  }
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.mobile-toggle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 32px;
  height: 32px;
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 10;
}

@media (min-width: 900px) {
  .mobile-toggle {
    display: none;
  }
}

.mobile-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background: white;
  border-radius: 2px;
  transition: all 0.3s ease;
}

header.scrolled .mobile-toggle span {
  background: #0f172a;
}

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  z-index: 200;
  display: flex;
  flex-direction: column;
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 2rem;
}

.mobile-header .logo-text {
  color: white;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #a5b4fc;
}

.mobile-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
}

.mobile-nav a {
  color: white;
  text-decoration: none;
  font-size: 1.75rem;
  font-weight: 600;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.mobile-nav a:hover {
  color: #a5b4fc;
  padding-left: 1rem;
}

.mobile-footer {
  padding: 2rem;
}

.mobile-cta {
  display: block;
  text-align: center;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  transition: all 0.3s ease;
}

.mobile-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}
</style>
