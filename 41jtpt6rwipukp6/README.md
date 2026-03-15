# Tester

Pala site exported for local development.

## Structure

```
blocks/           # Svelte components with content fields
  {name}/
    component.svelte
    fields.json
page-types/       # Page templates
  {name}/
    config.json
pages/            # Page content
site/             # Site-wide settings
.pala/            # Internal metadata
```

## Creating Blocks

Each block needs two files:

**component.svelte** - Svelte 5 component:
```svelte
<h1>{headline}</h1>
{#if image?.url}
  <img src={image.url} alt={image.alt} />
{/if}

<style>
  h1 { font-size: 2rem; }
</style>
```

**fields.json** - Field definitions:
```json
{
  "name": "Hero",
  "fields": [
    { "name": "headline", "label": "Headline", "type": "text" },
    { "name": "image", "label": "Image", "type": "image" }
  ]
}
```

## Field Types

### text
Single-line text input.
```svelte
<h1>{headline}</h1>
```

### rich-text
WYSIWYG editor. Outputs HTML.
```svelte
{@html content}
```

### markdown
Markdown editor. Outputs HTML.
```svelte
{@html body}
```

### image
Image upload. Returns `{ url, alt, width, height }`.
```svelte
{#if image?.url}
  <img src={image.url} alt={image.alt} />
{/if}
```

### link
URL with label. Returns `{ url, label }`.
```svelte
{#if cta?.url}
  <a href={cta.url}>{cta.label}</a>
{/if}
```

### url
Plain URL string.
```svelte
<a href={website_url}>Visit</a>
```

### icon
Icon picker. Returns SVG string.
```svelte
{@html icon}
```

### number
Numeric input.
```json
{ "name": "columns", "type": "number", "options": { "min": 1, "max": 6 } }
```

### switch
Boolean toggle.
```svelte
{#if show_title}<h1>{title}</h1>{/if}
```

### select
Dropdown selection.
```json
{ "name": "align", "type": "select", "options": { "choices": ["left", "center", "right"] } }
```
```svelte
<div class="text-{align}">{content}</div>
```

### repeater
List of items with nested fields.
```json
{
  "name": "features",
  "type": "repeater",
  "options": {
    "fields": [
      { "name": "title", "type": "text" },
      { "name": "description", "type": "text" }
    ]
  }
}
```
```svelte
{#each features as feature}
  <div>
    <h3>{feature.title}</h3>
    <p>{feature.description}</p>
  </div>
{/each}
```

### group
Nested object of fields.
```json
{
  "name": "author",
  "type": "group",
  "options": {
    "fields": [
      { "name": "name", "type": "text" },
      { "name": "avatar", "type": "image" }
    ]
  }
}
```
```svelte
<div>{author.name}</div>
{#if author.avatar?.url}<img src={author.avatar.url} />{/if}
```

### page
Reference to another page. Returns page data with `_meta.url`.
```json
{ "name": "featured_post", "type": "page", "options": { "page_type": "blog-post" } }
```

### page-list
All pages of a type.
```json
{ "name": "posts", "type": "page-list", "options": { "page_type": "blog-post" } }
```

### page-field
Reference a field from the current page type.

### site-field
Reference a site-wide field.

### slider
Range slider for numeric values.
```json
{ "name": "opacity", "type": "slider", "options": { "min": 0, "max": 100, "step": 10 } }
```

### date
Date picker.

### info
Display-only text for editors (not rendered in component).

## Svelte 5 Syntax

Components use Svelte 5:
- `$state()` for reactive variables
- `$derived()` for computed values
- `$effect()` for side effects
- `onclick={handler}` not `on:click={handler}`

## This Site

### Blocks

- `basic` - Basic
- `r37xm1yfttk9iv4` - 
- `features` - Features
- `hero` - Hero
- `call-to-action` - Call to Action

### Page Types

- `default` - Default
- `blog-post` - Blog Post

## Workflow

1. Edit blocks, pages, or site settings locally
2. Run `pala dev` to preview changes
3. Run `pala import` to push changes back to server
