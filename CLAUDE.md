# Pala CMS Development Guide for Claude Code

This document provides guidelines for helping users work with Pala CMS sites.

## Core Principles

1. **Always validate before importing** - Run `pala validate` before any import
2. **Use Svelte 5 syntax** - All components must use `$state()`, `$derived()`, `$effect()`, `onclick={}`
3. **Follow field structure rules** - Every field needs specific required properties
4. **Use theme CSS variables** - Make sites themeable with `--theme-*` variables

## Field Structure Rules

### Every Field Must Have These Properties

```json
{
  "id": "unique-id",          // REQUIRED: Unique within block/page-type
  "name": "field_name",       // REQUIRED: Used in component as variable
  "label": "Field Label",     // REQUIRED: Shown in CMS editor (except 'info' type)
  "type": "text",             // REQUIRED: Must be valid type (see below)
  "options": null,            // REQUIRED: null for most types, object for select
  "parent": "parent_name"     // OPTIONAL: For nested fields in repeaters
}
```

### Valid Field Types (COMPLETE LIST)

```
text, rich-text, markdown, image, link, url, icon, number,
switch, select, repeater, group, page, page-list, page-field,
site-field, slider, date, info
```

**Common mistake:** Using `checkbox` type - use `switch` or `select` instead.

### Select Field Structure (CRITICAL)

Select fields have special requirements. Each option MUST have `label`, `value`, AND `icon`:

```json
{
  "id": "field-id",
  "name": "field_name",
  "label": "Field Label",
  "type": "select",
  "options": {
    "options": [
      {"label": "Option 1", "value": "value1", "icon": ""},
      {"label": "Option 2", "value": "value2", "icon": ""}
    ]
  }
}
```

**Common mistake:** Forgetting the `icon` property. It's required even if empty string.

### Repeater Fields with Parent Property

When creating repeater structures, child fields use `parent` property (NOT `options.fields`):

```json
[
  {
    "id": "services-list",
    "name": "services",
    "label": "Services",
    "type": "repeater",
    "options": null
  },
  {
    "id": "service-icon",
    "name": "icon",
    "label": "Icon",
    "type": "icon",
    "parent": "services",
    "options": null
  },
  {
    "id": "service-title",
    "name": "title",
    "label": "Title",
    "type": "text",
    "parent": "services",
    "options": null
  }
]
```

**Common mistake:** Using `options.fields` for child fields instead of `parent` property.

### Nested Repeaters

You can nest repeaters by setting parent to the nested repeater's name:

```json
[
  {
    "id": "rows",
    "name": "rows",
    "type": "repeater"
  },
  {
    "id": "fields",
    "name": "fields",
    "type": "repeater",
    "parent": "rows"
  },
  {
    "id": "field-label",
    "name": "label",
    "type": "text",
    "parent": "fields"
  }
]
```

## Component Development

### Svelte 5 Syntax (REQUIRED)

```svelte
<script>
// ✅ CORRECT
let count = $state(0)
let name = $state('')
let doubled = $derived(count * 2)

$effect(() => {
  console.log('Count changed')
})

function handle_click() {
  count++
}

// ❌ WRONG - Never use these in Svelte 5
// export let count = 0
// $: doubled = count * 2
// $: console.log('Count changed')
</script>

<!-- ✅ CORRECT -->
<button onclick={handle_click}>Click</button>

<!-- ❌ WRONG -->
<button on:click={handle_click}>Click</button>
```

### Using Field Values in Components

Field values are globally available by their `name` property:

```svelte
<!-- Text field -->
<h1>{title}</h1>

<!-- Image field (object) -->
{#if image?.url}
  <img src={image.url} alt={image.alt} />
{/if}

<!-- Link field (object) -->
{#if cta?.url}
  <a href={cta.url}>{cta.label}</a>
{/if}

<!-- Repeater -->
{#if items?.length}
  {#each items as item}
    <div>{item.title}</div>
  {/each}
{/if}

<!-- Rich text (HTML output) -->
{@html body}

<!-- Icon (SVG output) -->
{@html icon}

<!-- Select (string value) -->
<button class="btn-{style}">Click</button>
```

### Theme Variables (REQUIRED)

Always use CSS custom properties for themeable values:

```css
.section {
  background: var(--theme-primary, #6366f1);
  color: var(--theme-text, #0f172a);
  font-family: var(--theme-heading-font, system-ui);
  padding: var(--theme-section-padding, 5rem) 0;
}

.button {
  background: var(--theme-primary, #6366f1);
  border: 1px solid var(--theme-border-color, #e2e8f0);
}
```

**Common theme variables:**
- `--theme-primary`, `--theme-primary-dark`
- `--theme-background`, `--theme-background-secondary`
- `--theme-text`, `--theme-text-muted`
- `--theme-border-color`
- `--theme-heading-font`, `--theme-body-font`
- `--theme-section-padding`

### Editor Detection

To change behavior in the CMS editor vs production:

```svelte
<script>
let is_editor = $state(false)

$effect(() => {
  if (typeof window !== 'undefined') {
    is_editor = window.__PALA_CONTEXT__?.environment === 'editor'
  }
})
</script>

<header class:in-editor={is_editor}>
  <!-- ... -->
</header>

<style>
header {
  position: fixed;
  top: 0;
}

header.in-editor {
  position: relative; /* Not fixed in editor */
}
</style>
```

## File Structure

### Block Structure

```
blocks/
└── hero/
    ├── component.svelte    # REQUIRED (lowercase!)
    ├── fields.json         # REQUIRED
    └── content.yaml        # OPTIONAL (default content)
```

**CRITICAL:** The filename must be `component.svelte` (lowercase), not `Component.svelte`. The import will silently skip blocks with incorrect casing.

**fields.json format:**
```json
{
  "id": "hero",
  "name": "Hero",
  "fields": [
    {
      "id": "hero-title",
      "name": "title",
      "label": "Title",
      "type": "text",
      "options": null
    }
  ]
}
```

### Page Type Structure

```
page-types/
└── landing/
    └── config.json
```

**config.json format:**
```json
{
  "name": "Landing Page",
  "fields": [
    {
      "id": "page-title",
      "name": "title",
      "label": "Page Title",
      "type": "text",
      "options": null
    }
  ]
}
```

### Page YAML Structure

Pages use `sections` (not `blocks`) with nested `content` objects:

```yaml
id: page-id
name: Page Name
slug: page-slug
page_type: default
fields:
  title: "Page Title"
  description: "Page description"
sections:
  - block: hero
    content:
      headline: "Welcome"
      subheadline: "This is the subheadline"
      primary_cta:
        label: "Get Started"
        url: "/signup"
  - block: features
    content:
      title: "Features"
      features:
        - icon: "<svg>...</svg>"
          feature_title: "Feature 1"
          description: "Description here"
```

**CRITICAL:** Use `sections` with `block` and nested `content`, NOT `blocks` with flat properties.

### Site Structure

```
site/
├── fields.json   # Site-wide field definitions (MUST be plain array!)
└── data.yaml     # Site-wide data
```

**site/fields.json format (plain array, not wrapped in object):**
```json
[]
```

Or with fields:
```json
[
  {
    "id": "site-name",
    "name": "site_name",
    "label": "Site Name",
    "type": "text",
    "options": null
  }
]
```

## Validation Checklist

Before importing, ensure:

1. ✅ All fields have `id`, `name`, `label`, `type`, `options`
2. ✅ All field types are valid (no `checkbox`, etc.)
3. ✅ All select options have `label`, `value`, `icon`
4. ✅ All `parent` references exist
5. ✅ No duplicate field IDs
6. ✅ All blocks have `component.svelte` (lowercase!) and `fields.json`
7. ✅ All page types have `config.json` with `name` field
8. ✅ Page YAML uses `sections` with `block` and `content` (not `blocks`)
9. ✅ `site/fields.json` is a plain array (not wrapped in object)
10. ✅ Components use Svelte 5 syntax
11. ✅ Components use theme CSS variables
12. ✅ Run `pala validate` to verify

## Common Patterns

### Form with Custom Endpoint

```json
{
  "id": "form-endpoint",
  "name": "endpoint",
  "label": "Form Endpoint URL",
  "type": "text",
  "options": null
}
```

```svelte
<script>
let form_state = $state('idle')
let form_element = $state(null)

async function handle_submit(event) {
  event.preventDefault()
  if (!endpoint) return

  form_state = 'submitting'
  const form_data = new FormData(event.target)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: form_data
    })

    if (response.ok) {
      form_state = 'success'
      form_element.reset()
      setTimeout(() => form_state = 'idle', 5000)
    } else {
      form_state = 'error'
      setTimeout(() => form_state = 'idle', 5000)
    }
  } catch (error) {
    form_state = 'error'
    setTimeout(() => form_state = 'idle', 5000)
  }
}
</script>

<form onsubmit={handle_submit} bind:this={form_element}>
  <!-- fields -->
  <button type="submit" disabled={form_state === 'submitting'}>
    {#if form_state === 'submitting'}
      Sending...
    {:else}
      Send
    {/if}
  </button>

  {#if form_state === 'success'}
    <div class="success">Message sent!</div>
  {/if}

  {#if form_state === 'error'}
    <div class="error">Error sending message.</div>
  {/if}
</form>
```

### Dynamic Logo (Image or Text)

```json
[
  {
    "id": "logo-type",
    "name": "logo_type",
    "label": "Logo Type",
    "type": "select",
    "options": {
      "options": [
        {"label": "Image", "value": "image", "icon": ""},
        {"label": "Text", "value": "text", "icon": ""}
      ]
    }
  },
  {
    "id": "logo-image",
    "name": "logo_image",
    "label": "Logo Image",
    "type": "image",
    "options": null
  },
  {
    "id": "logo-text",
    "name": "logo_text",
    "label": "Logo Text",
    "type": "text",
    "options": null
  }
]
```

```svelte
{#if logo_type === 'image' && logo_image?.url}
  <img src={logo_image.url} alt={logo_image.alt} />
{:else if logo_type === 'text' && logo_text}
  <span class="logo-text">{logo_text}</span>
{/if}
```

### Service/Feature Cards with Repeater

```json
[
  {
    "id": "services",
    "name": "services",
    "label": "Services",
    "type": "repeater",
    "options": null
  },
  {
    "id": "service-icon",
    "name": "icon",
    "label": "Icon",
    "type": "icon",
    "parent": "services",
    "options": null
  },
  {
    "id": "service-title",
    "name": "title",
    "label": "Title",
    "type": "text",
    "parent": "services",
    "options": null
  },
  {
    "id": "service-description",
    "name": "description",
    "label": "Description",
    "type": "text",
    "parent": "services",
    "options": null
  }
]
```

```svelte
{#if services?.length}
  <div class="services-grid">
    {#each services as service}
      <div class="service-card">
        {#if service.icon}
          <div class="icon">{@html service.icon}</div>
        {/if}
        <h3>{service.title}</h3>
        <p>{service.description}</p>
      </div>
    {/each}
  </div>
{/if}
```

## Workflow When Helping Users

1. **Read existing structure** - Check current fields.json and Component.svelte
2. **Plan changes** - Determine what fields need to be added/modified
3. **Update fields.json** - Add/modify field definitions
4. **Update Component.svelte** - Use the new fields in markup
5. **Create content.yaml** - Provide sensible default content
6. **Validate** - Run `pala validate` before suggesting import
7. **Build** - Run `npm run build` if code changes were made
8. **Test** - Verify the changes work as expected

## Error Messages to Watch For

### "Missing icon property"
**Fix:** Add `"icon": ""` to all select options

### "Invalid field type: checkbox"
**Fix:** Change to `"type": "switch"` or use select with Yes/No options

### "Parent field not found"
**Fix:** Ensure parent field exists and name matches exactly

### "Duplicate field ID"
**Fix:** Make each field ID unique within the block/page-type

### "Missing component.svelte"
**Fix:** Every block needs a `component.svelte` file (lowercase!)

### "Invalid JSON syntax"
**Fix:** Check for trailing commas, missing quotes, etc.

## When Creating New Blocks

1. Create directory: `blocks/block-name/`
2. Create `fields.json` with field definitions
3. Create `component.svelte` (lowercase!) with Svelte 5 syntax
4. Create `content.yaml` with example content
5. Run `pala validate` to verify
6. Test in dev server or import to Pala

## CLI Command Reference

```bash
# Validate before importing (ALWAYS DO THIS)
pala validate

# Export from server
pala export --server URL --site ID

# Import to server
pala import

# Preview import without applying
pala import --preview

# Start dev server
pala dev
```
