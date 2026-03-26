# Primo CLI

Local development CLI for [Primo](https://primocms.org) - build and edit sites with a visual CMS.

## Installation

```bash
npm install -g primo-cli
```

## Quick Start

```bash
# Create a new site
primo new my-site

# This starts the local CMS automatically
# Edit at: http://my-site.localhost:3000/admin/site
# Preview at: http://my-site.localhost:3000/
```

## Commands

### `primo new [name]`

Create a new site with starter files.

```bash
primo new                    # Interactive prompt for name
primo new my-site            # Create "my-site" directory
primo new --skip-dev         # Create files without starting CMS
```

### `primo dev`

Start the local CMS server. Watches for file changes and syncs edits from the CMS back to local files.

```bash
primo dev                    # Start in current directory
primo dev -p 8080            # Use custom port
```

Supports multi-site mode - put multiple site folders in one directory with a `server.json`:

```json
{ "port": 3000 }
```

### `primo push`

Push local files to a hosted Primo instance.

```bash
primo push -s https://cms.example.com --site abc123
primo push --preview         # Preview changes without applying
```

Options:
- `-s, --server <url>` - Server URL
- `--site <id>` - Site ID
- `-d, --dir <dir>` - Directory (default: `.`)
- `-t, --token <token>` - Auth token
- `--preview` - Preview only

### `primo pull`

Pull from a hosted Primo instance to local files.

```bash
primo pull -s https://cms.example.com
primo pull --site abc123 -o ./my-site
```

Options:
- `-s, --server <url>` - Server URL (auto-detects local)
- `--site <id>` - Site ID (interactive if not provided)
- `-o, --output <dir>` - Output directory (default: `.`)
- `-t, --token <token>` - Auth token

### `primo login`

Authenticate with a hosted Primo instance.

```bash
primo login https://cms.example.com
primo login https://cms.example.com -e user@example.com
```

### `primo publish`

Deploy your site with CMS to Railway or Fly.io.

```bash
primo publish                # Interactive provider selection
primo publish -p railway     # Deploy to Railway
primo publish -p fly         # Deploy to Fly.io
```

### `primo validate`

Check site structure for errors.

```bash
primo validate
primo validate --strict      # Strict mode
```

## Site Structure

```
my-site/
├── primo.json          # Site config (name, site_id, host)
├── blocks/             # Svelte components
│   └── hero/
│       ├── component.svelte
│       ├── fields.json
│       └── content.yaml
├── pages/              # Page content (YAML)
│   └── index.yaml
├── page-types/         # Page templates
│   └── default/
│       └── config.json
├── site/               # Site-wide settings
│   ├── fields.json
│   ├── content.yaml
│   └── head.svelte
└── uploads/            # Media files
```

## Requirements

- Node.js 18+
- For `primo publish`: Railway CLI or Fly.io CLI
