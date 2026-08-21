import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	base: './',
	plugins: [react()],
	server: {
                allowedHosts: true,
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
			'/uploads': {
				target: 'http://localhost:5050',
				changeOrigin: true,
			},
			'/models': {
				target: 'http://localhost:5050',
				changeOrigin: true,
			},
			'/socket.io': {
				target: 'http://localhost:5050',
				ws: true,
				changeOrigin: true,
			},
		},
	},
	preview: {
                allowedHosts: true,
		host: '0.0.0.0',
		port: 4664,
		strictPort: true,
	},
	optimizeDeps: {
		exclude: ['pdfjs-dist'],
	},
});
