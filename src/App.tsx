import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileUploader, type UploadResult } from './components/FileUploader';
import { PresentationViewer } from './components/PresentationViewer';
import { HandCameraWidget } from './components/HandCameraWidget';
import { GestureHUD } from './components/GestureHUD';
import { LaserPointer } from './components/LaserPointer';
import { ThreeDViewer } from './components/ThreeDViewer';
import { useHandTracking } from './hooks/useHandTracking';
import { usePresentationGestures } from './hooks/usePresentationGestures';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function clamp(v: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, v));
}

export default function App() {
	const [module, setModule] = useState<'presentation' | 'model3d'>('presentation');
	const [presentation, setPresentation] = useState<UploadResult | null>(null);
	const [pageNumber, setPageNumber] = useState(1);
	const [pageCount, setPageCount] = useState(1);
	const [zoom, setZoom] = useState(1);
	const [pointerPoint, setPointerPoint] = useState<{
		x: number;
		y: number;
	} | null>(null);

	const { active, loading, error, hands, videoRef, start, stop } =
		useHandTracking();
	const gestureFrame = usePresentationGestures(hands, active);

	const goToPage = useCallback(
		(updater: (p: number) => number) => {
			setPageNumber(p => clamp(updater(p), 1, pageCount));
			setZoom(1);
		},
		[pageCount],
	);

	useEffect(() => {
		const action = gestureFrame.action;
		switch (action.type) {
			case 'next-slide':
				goToPage(p => p + 1);
				break;
			case 'prev-slide':
				goToPage(p => p - 1);
				break;
			case 'zoom':
				setZoom(z => clamp(z * action.factor, MIN_ZOOM, MAX_ZOOM));
				break;
			case 'point':
				setPointerPoint({ x: action.x, y: action.y });
				break;
			case 'point-end':
				setPointerPoint(null);
				break;
			case 'reset':
				setZoom(1);
				break;
			default:
				break;
		}
	}, [gestureFrame.action]);

	const handleUploaded = useCallback((result: UploadResult) => {
		setPresentation(result);
		setPageNumber(1);
		setPageCount(1);
		setZoom(1);
	}, []);

	const resetZoom = useCallback(() => {
		setZoom(1);
	}, []);

	const fileUrl = useMemo(() => presentation?.fileUrl ?? '', [presentation]);

	useEffect(() => {
		if (!fileUrl) return;
		return () => URL.revokeObjectURL(fileUrl);
	}, [fileUrl]);

	if (module === 'model3d') {
		return <ThreeDViewer onBack={() => setModule('presentation')} />;
	}

	if (!presentation) {
		return (
		<div style={{ minHeight: '100%', position: 'relative' }}>
			<button onClick={() => setModule('model3d')} style={moduleButton}>
				3D tegirmon →
			</button>
			<FileUploader onUploaded={handleUploaded} />
		</div>
		);
	}

	return (
		<div
			style={{
				position: 'relative',
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<header
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '10px 18px',
					borderBottom: '1px solid var(--border)',
					background: 'var(--surface)',
					zIndex: 40,
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						minWidth: 0,
					}}
				>
					<span
						style={{
							fontFamily: 'var(--font-display)',
							fontWeight: 600,
							fontSize: 15,
						}}
					>
						Gesture Presenter
					</span>
					<span
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 12,
							color: 'var(--text-muted)',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
							maxWidth: 240,
						}}
					>
						{presentation.originalName}
					</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<button onClick={() => setModule('model3d')} style={toolbarBtn}>
						3D modul
					</button>
					<button onClick={() => goToPage(p => p - 1)} style={toolbarBtn}>
						← Oldingi
					</button>
					<span
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 12,
							color: 'var(--text-muted)',
							minWidth: 64,
							textAlign: 'center',
						}}
					>
						{pageNumber} / {pageCount}
					</span>
					<button onClick={() => goToPage(p => p + 1)} style={toolbarBtn}>
						Keyingi →
					</button>
					<div
						style={{
							width: 1,
							height: 20,
							background: 'var(--border)',
							margin: '0 4px',
						}}
					/>
					<button onClick={resetZoom} style={toolbarBtn}>
						Zoom: {Math.round(zoom * 100)}% ↺
					</button>
					<button onClick={() => setPresentation(null)} style={toolbarBtn}>
						Boshqa fayl
					</button>
				</div>
			</header>

			<main style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
				<PresentationViewer
					fileUrl={fileUrl}
					pageNumber={pageNumber}
					zoom={zoom}
					onReady={setPageCount}
				/>
				<LaserPointer point={pointerPoint} />
				<GestureHUD label={gestureFrame.label} active={active} />
				<HandCameraWidget
					videoRef={videoRef}
					hands={gestureFrame.hands}
					active={active}
					loading={loading}
					error={error}
					label={gestureFrame.label}
					onToggle={() => (active ? stop() : start())}
				/>
			</main>
		</div>
	);
}

const toolbarBtn: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 12,
	padding: '6px 12px',
	borderRadius: 8,
	border: '1px solid var(--border)',
	background: 'var(--surface-2)',
	color: 'var(--text)',
	cursor: 'pointer',
};

const moduleButton: React.CSSProperties = {
	...toolbarBtn,
	position: 'absolute',
	top: 18,
	right: 18,
	zIndex: 10,
	color: 'var(--accent)',
};
