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
