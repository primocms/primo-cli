# Northstar Solutions - Pala Site

## Project Structure

This is a Pala CMS brochure site for a consulting business.

- `blocks/` - Reusable Svelte components with content fields
- `page-types/` - Page templates that define structure
- `pages/` - Individual pages with content
- `site/` - Site-wide settings and content

## Svelte 5 Syntax

All components use Svelte 5 syntax:
- Use `$state()` for reactive variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects
- Use `onclick={handler}` not `on:click={handler}`

## Field Variables

Field values are globally available in block components:

```svelte
<!-- Text field -->
<h1>{headline}</h1>

<!-- Image field (object with url and alt) -->
{#if image?.url}
  <img src={image.url} alt={image.alt} />
{/if}

<!-- Link field (object with url and label) -->
{#if cta?.url}
  <a href={cta.url}>{cta.label}</a>
{/if}

<!-- Rich text (outputs HTML) -->
{@html body}

<!-- Icon (outputs SVG string) -->
{@html icon}
```

## Available Blocks

- **Basic** (`blocks/basic/`) - Simple rich text content
- **Hero** (`blocks/hero/`) - Hero section with headline, subtext, CTA
- **Features** (`blocks/features/`) - Feature grid
- **Services** (`blocks/services/`) - Services listing
- **Testimonials** (`blocks/testimonials/`) - Client testimonials
- **Team** (`blocks/team/`) - Team member cards
- **Contact** (`blocks/contact/`) - Contact form and info
- **CTA** (`blocks/cta/`) - Call to action section
- **Navigation** (`blocks/r37xm1yfttk9iv4/`) - Site header/navigation

## Available Pages

- **Home** (`pages/index.yaml`) - Landing page
- **Services** (`pages/services.yaml`) - Service offerings
- **About** (`pages/about.yaml`) - Company story and team
- **Contact** (`pages/contact.yaml`) - Contact information
- **Blog** (`pages/blog/index.yaml`) - Blog listing
  - `pages/blog/building-blocks.yaml`
  - `pages/blog/deployment-guide.yaml`
  - `pages/blog/getting-started.yaml`

## Import Back to Pala

After editing locally, import your changes back using:
1. `pala import` CLI command, or
2. Site Settings → Import in the Pala UI
