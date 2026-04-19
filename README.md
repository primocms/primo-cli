# Primo CLI

Local development CLI for [Primo](https://primo.page) - build and edit sites with a visual CMS.

## Installation

```bash
npm install -g primo-cli
```

## Quick Start

```bash
# Create a new site
primo new my-site

# This starts the local CMS automatically
# It scaffolds a workspace like:
# ./server.yaml
# ./library/
# ./sites/my-site/
```

## Commands

### `primo new [name]`

Create a new site with starter files.

```bash
primo new                    # Interactive prompt for name
primo new my-site            # Create "sites/my-site" in the current workspace
primo new --skip-dev         # Create files without starting CMS
```

### `primo dev`

Start the local CMS server. Watches for file changes and syncs edits from the CMS back to local files.

```bash
primo dev                    # Start in current directory
primo dev -p 8080            # Use custom port
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

### `primo library pull`

Pull the shared block library into a workspace root.

```bash
primo library pull -s https://cms.example.com
primo library pull -o ./my-workspace
```

Options:
- `-s, --server <url>` - Server URL (auto-detects local)
- `-o, --output <dir>` - Workspace output directory (default: `.`)
- `-t, --token <token>` - Auth token

### `primo library push`

Push the local shared block library back to a hosted Primo instance.

```bash
primo library push -s https://cms.example.com
primo library push -s https://cms.example.com -d ./my-workspace
```

Options:
- `-s, --server <url>` - Server URL
- `-d, --dir <dir>` - Workspace directory containing `library/` (default: `.`)
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

### `primo build`

Build static HTML site for deployment to any static host.

```bash
primo build                  # Output to ./dist
primo build -o ./public      # Custom output directory
```

Deploy the output anywhere:
```bash
# Netlify
npx netlify deploy --prod --dir=dist

# Vercel
npx vercel dist

# Cloudflare Pages
npx wrangler pages deploy dist

# Or just push to a repo connected to any static host
```

## Site Structure

```
workspace/
├── server.yaml
├── library/
└── sites/
    └── my-site/
        ├── site.yaml
        ├── blocks/
        ├── pages/
        ├── page-types/
        └── site/
```

## Multiple Sites

Run `primo dev` from a workspace folder to work on multiple sites at once:

```
workspace/
├── server.yaml         # Optional: port + site_groups
└── sites/
    ├── site-one/
    │   └── site.yaml   # includes group: default
    └── site-two/
        └── site.yaml   # includes group: default
```

Each site gets its own subdomain: `site-one.localhost:3000`, `site-two.localhost:3000`

## Shared Library Workspace

The shared block library can live at the workspace root alongside the `sites/` folder:

```text
workspace/
├── server.yaml
├── library/
│   ├── marketing/
│   │   └── hero/
│   └── shared/
│       └── footer/
└── sites/
    ├── site-one/
    └── site-two/
```

## Documentation

Full documentation: [primo.page/docs](https://primo.page/docs)

## Requirements

- Node.js 18+
- For `primo publish`: Railway CLI or Fly.io CLI
