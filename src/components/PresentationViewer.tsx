import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).href;

interface PresentationViewerProps {
	fileUrl: string;
	pageNumber: number;
	zoom: number;
	onReady?: (pageCount: number) => void;
}

export function PresentationViewer({
	fileUrl,
	pageNumber,
	zoom,
	onReady,
}: PresentationViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
	const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
		'loading',
	);
	const [errorMsg, setErrorMsg] = useState('');

	useEffect(() => {
		let cancelled = false;
		setStatus('loading');
		const task = pdfjsLib.getDocument(fileUrl);
		task.promise
			.then(doc => {
				if (cancelled) return;
				pdfRef.current = doc;
				onReady?.(doc.numPages);
				setStatus('ready');
			})
			.catch(err => {
				if (cancelled) return;
				setErrorMsg(err instanceof Error ? err.message : 'PDF ochilmadi');
				setStatus('error');
			});
		return () => {
			cancelled = true;
			task.destroy();
			pdfRef.current = null;
		};
	}, [fileUrl, onReady]);

	useEffect(() => {
		if (status !== 'ready') return;
		const doc = pdfRef.current;
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!doc || !canvas || !container) return;

		let cancelled = false;

		const render = async () => {
			const page = await doc.getPage(pageNumber);
			if (cancelled) return;
			const containerRect = container.getBoundingClientRect();
			const baseViewport = page.getViewport({ scale: 1 });
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const fitScale =
				Math.min(
					containerRect.width / baseViewport.width,
					containerRect.height / baseViewport.height,
				) * dpr;
			const viewport = page.getViewport({ scale: Math.max(fitScale, 0.1) });

			canvas.width = viewport.width;
			canvas.height = viewport.height;
			canvas.style.width = `${viewport.width / dpr}px`;
			canvas.style.height = `${viewport.height / dpr}px`;

			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			await page.render({ canvasContext: ctx, viewport }).promise;
		};

		void render();
		return () => {
			cancelled = true;
		};
	}, [status, pageNumber]);

	return (
		<div
			ref={containerRef}
			style={{
				position: 'relative',
				width: '100%',
				height: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				overflow: 'hidden',
				background: '#0e1016',
			}}
		>
			{status === 'error' && (
				<div
					style={{
						color: 'var(--danger)',
						fontFamily: 'var(--font-mono)',
						fontSize: 13,
					}}
				>
					PDF render qilinmadi: {errorMsg}
				</div>
			)}
			<canvas
				ref={canvasRef}
				style={{
					boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
					borderRadius: 4,
					transform: `scale(${zoom})`,
					transformOrigin: 'center center',
					transition: 'box-shadow 200ms ease',
					opacity: status === 'ready' ? 1 : 0,
				}}
			/>
		</div>
	);
}
