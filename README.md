# Pala CLI

Local development CLI for [Pala](https://palacms.com) - build and edit sites with a visual CMS.

## Installation

```bash
npm install -g pala-cli
```

## Quick Start

```bash
# Create a new site
pala new my-site

# This starts the local CMS automatically
# Edit at: http://my-site.localhost:3000/admin/site
# Preview at: http://my-site.localhost:3000/
```

## Commands

### `pala new [name]`

Create a new site with starter files.

```bash
pala new                    # Interactive prompt for name
pala new my-site            # Create "my-site" directory
pala new --skip-dev         # Create files without starting CMS
```

### `pala dev`

Start the local CMS server. Watches for file changes and syncs edits from the CMS back to local files.

```bash
pala dev                    # Start in current directory
pala dev -p 8080            # Use custom port
```

Supports multi-site mode - put multiple site folders in one directory with a `server.json`:

```json
{ "port": 3000 }
```

### `pala push`

Push local files to a hosted Pala instance.

```bash
pala push -s https://cms.example.com --site abc123
pala push --preview         # Preview changes without applying
```

Options:
- `-s, --server <url>` - Server URL
- `--site <id>` - Site ID
- `-d, --dir <dir>` - Directory (default: `.`)
- `-t, --token <token>` - Auth token
- `--preview` - Preview only

### `pala pull`

Pull from a hosted Pala instance to local files.

```bash
pala pull -s https://cms.example.com
pala pull --site abc123 -o ./my-site
```

Options:
- `-s, --server <url>` - Server URL (auto-detects local)
- `--site <id>` - Site ID (interactive if not provided)
- `-o, --output <dir>` - Output directory (default: `.`)
- `-t, --token <token>` - Auth token

### `pala login`

Authenticate with a hosted Pala instance.

```bash
pala login https://cms.example.com
pala login https://cms.example.com -e user@example.com
```

### `pala publish`

Deploy your site with CMS to Railway or Fly.io.

```bash
pala publish                # Interactive provider selection
pala publish -p railway     # Deploy to Railway
pala publish -p fly         # Deploy to Fly.io
```

### `pala validate`

Check site structure for errors.

```bash
pala validate
pala validate --strict      # Strict mode
```

## Site Structure

```
my-site/
├── pala.json           # Site config (name, site_id, host)
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
- For `pala publish`: Railway CLI or Fly.io CLI
