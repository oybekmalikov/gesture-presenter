interface GestureHUDProps {
	label: string;
	active: boolean;
}

const LEGEND: { icon: string; text: string }[] = [
	{ icon: '✋↑', text: "Qo'lni pastdan tepaga silkitish — keyingi slayd" },
	{ icon: '✋↓', text: "Qo'lni tepadan pastga silkitish — oldingi slayd" },
	{ icon: '🤲', text: "Ikki qo'l — zoom (uzoqlashtirish / yaqinlashtirish)" },
	{ icon: '☝️', text: "Ko'rsatkich barmoq — lazer kursor" },
	{ icon: '✊', text: "Musht — zoomni boshlang'ich holatga qaytarish" },
];

export function GestureHUD({ label, active }: GestureHUDProps) {
	return (
		<div
			style={{
				position: 'absolute',
				left: 16,
				bottom: 16,
				zIndex: 30,
				display: 'flex',
				flexDirection: 'column',
				gap: 8,
				maxWidth: 200,
			}}
		>
			<div
				style={{
					fontFamily: 'var(--font-mono)',
					fontSize: 12,
					padding: '7px 12px',
					borderRadius: 8,
					border: '1px solid var(--border)',
					background: 'rgba(20,23,31,0.9)',
					backdropFilter: 'blur(6px)',
					color: active ? 'var(--accent)' : 'var(--text-muted)',
					width: 'fit-content',
				}}
			>
				{active ? label : "Kamera o'chiq — qo'lda boshqaring"}
			</div>
			<div
				style={{
					border: '1px solid var(--border)',
					background: 'rgba(20,23,31,0.9)',
					backdropFilter: 'blur(6px)',
					borderRadius: 10,
					padding: '10px 12px',
					display: 'flex',
					flexDirection: 'column',
					gap: 6,
				}}
			>
				{LEGEND.map(item => (
					<div
						key={item.text}
						style={{
							display: 'flex',
							gap: 8,
							alignItems: 'flex-start',
							fontSize: 11.5,
							color: 'var(--text-muted)',
						}}
					>
						<span style={{ minWidth: 22 }}>{item.icon}</span>
						<span>{item.text}</span>
					</div>
				))}
			</div>
		</div>
	);
}
