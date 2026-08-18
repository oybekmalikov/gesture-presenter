import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		host: '0.0.0.0',
		port: 4664,
		strictPort: true,
		proxy: {
			'/api': {
				target: 'http://localhost:5050',
				changeOrigin: true,
			},
			'/files': {
				target: 'http://localhost:5050',
				changeOrigin: true,
			},
		},
	},
	preview: {
		host: '0.0.0.0',
		port: 4664,
		strictPort: true,
	},
	optimizeDeps: {
		exclude: ['pdfjs-dist'],
	},
});
