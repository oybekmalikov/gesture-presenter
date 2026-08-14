interface LaserPointerProps {
	point: { x: number; y: number } | null;
}

export function LaserPointer({ point }: LaserPointerProps) {
	const visible = point !== null;
	const x = point ? point.x * 100 : 50;
	const y = point ? point.y * 100 : 50;

	return (
		<div
			aria-hidden
			style={{
				position: 'absolute',
				inset: 0,
				pointerEvents: 'none',
				zIndex: 20,
				opacity: visible ? 1 : 0,
				transition: 'opacity 160ms ease',
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: `${x}%`,
					top: `${y}%`,
					width: 220,
					height: 220,
					transform: 'translate(-50%, -50%)',
					borderRadius: '50%',
					background:
						'radial-gradient(circle, rgba(242,183,5,0.14) 0%, rgba(242,183,5,0) 70%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: `${x}%`,
					top: `${y}%`,
					width: 14,
					height: 14,
					transform: 'translate(-50%, -50%)',
					borderRadius: '50%',
					background: 'var(--accent)',
					boxShadow: '0 0 12px 3px rgba(242,183,5,0.7)',
				}}
			/>
		</div>
	);
}
