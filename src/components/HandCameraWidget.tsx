import { useEffect, useRef, useState } from 'react';
import type { HandReading } from '../types/gesture';

interface HandCameraWidgetProps {
	videoRef: React.RefObject<HTMLVideoElement>;
	hands: HandReading[];
	active: boolean;
	loading: boolean;
	error: string | null;
	label: string;
	onToggle: () => void;
}

const CONNECTIONS: readonly (readonly [number, number])[] = [
	[0, 1],
	[1, 2],
	[2, 3],
	[3, 4],
	[0, 5],
	[5, 6],
	[6, 7],
	[7, 8],
	[5, 9],
	[9, 10],
	[10, 11],
	[11, 12],
	[9, 13],
	[13, 14],
	[14, 15],
	[15, 16],
	[13, 17],
	[17, 18],
	[18, 19],
	[19, 20],
	[0, 17],
];

const WIDTH = 550;
const HEIGHT = 350;

export function HandCameraWidget({
	videoRef,
	hands,
	active,
	loading,
	error,
	label,
	onToggle,
}: HandCameraWidgetProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [corner, setCorner] = useState<'bottom' | 'top'>('bottom');

	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (!active) return;

		for (const hand of hands) {
			ctx.strokeStyle = 'rgba(124, 92, 252, 0.55)';
			ctx.lineWidth = 1;
			for (const [i, j] of CONNECTIONS) {
				const p1 = hand.landmarks[i];
				const p2 = hand.landmarks[j];
				if (!p1 || !p2) continue;
				ctx.beginPath();
				ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
				ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
				ctx.stroke();
			}
			ctx.fillStyle = 'rgba(231, 233, 238, 0.85)';
			for (let i = 0; i < hand.landmarks.length; i++) {
				const p = hand.landmarks[i];
				const isTip = [4, 8, 12, 16, 20].includes(i);
				ctx.fillStyle = isTip
					? 'rgba(242, 183, 5, 0.9)'
					: 'rgba(231, 233, 238, 0.55)';
				ctx.beginPath();
				ctx.arc(
					p.x * canvas.width,
					p.y * canvas.height,
					isTip ? 2.2 : 1.4,
					0,
					Math.PI * 2,
				);
				ctx.fill();
			}
		}
	}, [hands, active]);

	return (
		<div
			style={{
				position: 'absolute',
				right: 16,
				[corner === 'bottom' ? 'bottom' : 'top']: 16,
				zIndex: 30,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-end',
				gap: 6,
			}}
		>
			<div
				style={{
					width: WIDTH,
					height: HEIGHT,
					position: 'relative',
					borderRadius: 10,
					overflow: 'hidden',
					border: '1px solid var(--border)',
					background: 'var(--surface)',
					boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
				}}
			>
				<video
					ref={videoRef}
					playsInline
					muted
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						transform: 'scaleX(-1)',
						opacity: active ? 0.55 : 0,
					}}
				/>
				<canvas
					ref={canvasRef}
					width={WIDTH}
					height={HEIGHT}
					style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
				/>
				{!active && (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 12,
							color: 'var(--text-muted)',
							fontFamily: 'var(--font-mono)',
							textAlign: 'center',
							padding: 10,
						}}
					>
						{loading
							? 'Kamera ishga tushmoqda…'
							: error
								? error
								: "Kamera o'chiq"}
					</div>
				)}
				{active && (
					<div
						style={{
							position: 'absolute',
							left: 8,
							right: 8,
							top: 8,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							fontSize: 10,
							fontFamily: 'var(--font-mono)',
							color: 'var(--text)',
							background: 'rgba(11,13,18,0.7)',
							borderRadius: 6,
							padding: '3px 6px',
						}}
					>
						<span
							style={{
								whiteSpace: 'nowrap',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
							}}
						>
							{label}
						</span>
					</div>
				)}
			</div>

			<div style={{ display: 'flex', gap: 6 }}>
				<button
					onClick={onToggle}
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 11,
						padding: '5px 10px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: active ? 'var(--accent-soft)' : 'var(--surface)',
						color: active ? 'var(--accent)' : 'var(--text-muted)',
						cursor: 'pointer',
					}}
				>
					{active ? "Kamera o'chirish" : 'Kamerani yoqish'}
				</button>
				<button
					onClick={() => setCorner(c => (c === 'bottom' ? 'top' : 'bottom'))}
					title="Kamera oynasini yuqori/pastga ko'chirish"
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 11,
						padding: '5px 10px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text-muted)',
						cursor: 'pointer',
					}}
				>
					{corner === 'bottom' ? '↑' : '↓'}
				</button>
			</div>
		</div>
	);
}
