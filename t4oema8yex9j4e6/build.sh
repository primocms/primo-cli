#!/bin/bash
# Build static site for Vercel deployment

set -e

SITE_DIR="$(cd "$(dirname "$0")" && pwd)"
CLI_ROOT="$(cd "$SITE_DIR/../.." && pwd)"
DEV_DIR="$CLI_ROOT/.pala-dev"

echo "Building Primo site for production..."

# 1. Start dev server briefly to generate the Vite project
echo "→ Generating Vite project..."
cd "$SITE_DIR"
npx pala dev -p 4999 &
DEV_PID=$!
sleep 6
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true

# 2. Check that .pala-dev exists
if [ ! -d "$DEV_DIR" ]; then
    echo "Error: .pala-dev directory not found at $DEV_DIR"
    exit 1
fi

# 3. Create vite.config.js if it doesn't exist
if [ ! -f "$DEV_DIR/vite.config.js" ]; then
    cat > "$DEV_DIR/vite.config.js" << 'EOF'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: {
				runes: true
			}
		})
	],
	resolve: {
		dedupe: ['svelte']
	},
	build: {
		outDir: 'dist',
		rollupOptions: {
			input: {
				main: 'index.html',
				app: 'app.html'
			}
		}
	}
})
EOF
fi

# 4. Run Vite build
echo "→ Building with Vite..."
cd "$DEV_DIR"
npx vite build

# 5. Copy output to site directory
echo "→ Copying to $SITE_DIR/dist..."
rm -rf "$SITE_DIR/dist"
cp -r "$DEV_DIR/dist" "$SITE_DIR/"

# 6. Rename app.html to index.html (app.html is the actual site, index.html is dev toolbar)
cd "$SITE_DIR/dist"
rm -f index.html
mv app.html index.html

# 7. Create vercel.json for SPA routing
cat > "$SITE_DIR/dist/vercel.json" << 'EOF'
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
EOF

echo ""
echo "✓ Build complete!"
echo ""
echo "To deploy to Vercel:"
echo "  cd $SITE_DIR/dist"
echo "  vercel"
echo ""
