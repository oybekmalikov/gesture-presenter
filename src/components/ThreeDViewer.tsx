import { Bounds, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useHandTracking } from '../hooks/useHandTracking';
import { classifyHandShape, palmCenter } from '../utils/handShape';
import { ThreeDGestureProcessor } from '../utils/threeDGestureProcessor';
import { HandCameraWidget } from './HandCameraWidget';

const MODEL_URL = '/models/sag_mill_v2.glb';
const DWELL_MS = 450;
const MAGNET_RADIUS = 0.13;

interface ThreeDViewerProps { onBack: () => void; }
interface CursorPoint { x: number; y: number; }
interface PartInfo {
	id: string;
	name: string;
	object: THREE.Object3D;
	metadata: Record<string, unknown>;
}

interface ExplodablePart {
	object: THREE.Object3D;
	original: THREE.Vector3;
	offset: THREE.Vector3;
}

function metadataFor(object: THREE.Object3D): Record<string, unknown> {
	const hierarchy: THREE.Object3D[] = [];
	let current: THREE.Object3D | null = object;
	while (current) { hierarchy.unshift(current); current = current.parent; }
	const embedded = Object.assign({}, ...hierarchy.map(item => item.userData));
	const mesh = object instanceof THREE.Mesh ? object : null;
	const materials = mesh
		? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(item => item.name || item.type)
		: [];
	const geo = mesh?.geometry;
	const posAttr = geo?.getAttribute('position');
	const vertexCount = posAttr?.count;
	const triangleCount = geo?.index
		? Math.floor(geo.index.count / 3)
		: vertexCount
			? Math.floor(vertexCount / 3)
			: undefined;

	let dimensions: string | undefined;
	if (geo) {
		geo.computeBoundingBox();
		const bb = geo.boundingBox;
		if (bb) {
			const size = new THREE.Vector3();
			bb.getSize(size);
			dimensions = `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`;
		}
	}

	return {
		...embedded,
		name: object.name || 'Nomsiz detal',
		uuid: object.uuid,
		type: object.type,
		material: materials.join(', ') || undefined,
		vertices: vertexCount,
		triangles: triangleCount,
		dimensions,
		visible: object.visible,
		castShadow: object.castShadow,
		receiveShadow: object.receiveShadow,
	};
}

/* ── Explodable Model ── */
function ExplodableModel({
	exploded,
	rotation,
	scale,
}: {
	exploded: boolean;
	rotation: [number, number];
	scale: number;
}) {
	const gltf = useGLTF(MODEL_URL);
	const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
	const parts = useMemo<ExplodablePart[]>(() => {
		scene.updateWorldMatrix(true, true);
		const modelBox = new THREE.Box3().setFromObject(scene);
		const center = modelBox.getCenter(new THREE.Vector3());
		const diagonal = Math.max(modelBox.getSize(new THREE.Vector3()).length(), 1);
		const result: ExplodablePart[] = [];
		scene.traverse(object => {
			if (!(object instanceof THREE.Mesh) || !object.geometry) return;
			object.userData.selectableId = object.uuid;
			const partCenter = new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
			const direction = partCenter.sub(center);
			if (direction.lengthSq() < 1e-8) direction.set(0, 1, 0);
			direction.normalize();
			result.push({
				object,
				original: object.position.clone(),
				offset: direction.multiplyScalar(diagonal * 0.45),
			});
		});
		return result;
	}, [scene]);

	useFrame((_, delta) => {
		const damping = 1 - Math.exp(-4.5 * delta);
		for (const part of parts) {
			const target = part.original.clone();
			if (exploded) target.add(part.offset);
			part.object.position.lerp(target, damping);
		}
	});

	return (
		<group rotation={[rotation[0], rotation[1], 0]} scale={scale}>
			<primitive object={scene} />
		</group>
	);
}

/* ── Selection Box ── */
function SelectionBox({ object }: { object: THREE.Object3D | null }) {
	const helper = useMemo(() => object ? new THREE.BoxHelper(object, 0xf2b705) : null, [object]);
	useFrame(() => helper?.update());
	useEffect(() => () => helper?.dispose(), [helper]);
	return helper ? <primitive object={helper} /> : null;
}

/* ── Pointer Selector (raycast + magnet) ── */
function PointerSelector({
	pointer,
	onTarget,
}: {
	pointer: CursorPoint | null;
	onTarget: (part: PartInfo | null, cursor: CursorPoint | null, snapped: boolean) => void;
}) {
	const { camera, scene } = useThree();
	const raycaster = useMemo(() => new THREE.Raycaster(), []);
	const ndc = useMemo(() => new THREE.Vector2(), []);
	const projected = useMemo(() => new THREE.Vector3(), []);
	const box = useMemo(() => new THREE.Box3(), []);
	const lastTarget = useRef('');

	useFrame(() => {
		if (!pointer) {
			if (lastTarget.current) onTarget(null, null, false);
			lastTarget.current = '';
			return;
		}

		ndc.set(pointer.x * 2 - 1, -(pointer.y * 2 - 1));
		raycaster.setFromCamera(ndc, camera);
		const targets: THREE.Mesh[] = [];
		scene.traverse(object => {
			if (object instanceof THREE.Mesh && object.visible && object.userData.selectableId) targets.push(object);
		});
		const direct = raycaster.intersectObjects(targets, false)[0]?.object;
		let target = direct ?? null;
		let cursor = { ...pointer };
		let snapped = false;

		if (!target) {
			let nearestDistance = MAGNET_RADIUS;
			for (const candidate of targets) {
				box.setFromObject(candidate).getCenter(projected).project(camera);
				if (projected.z < -1 || projected.z > 1) continue;
				const distance = Math.hypot(projected.x - ndc.x, projected.y - ndc.y);
				if (distance < nearestDistance) {
					nearestDistance = distance;
					target = candidate;
					cursor = { x: (projected.x + 1) / 2, y: (1 - projected.y) / 2 };
					snapped = true;
				}
			}
		}

		const id = target?.uuid ?? '';
		lastTarget.current = id;
		onTarget(target ? {
			id,
			name: target.name || 'Nomsiz detal',
			object: target,
			metadata: metadataFor(target),
		} : null, cursor, snapped);
	});
	return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   Main ThreeDViewer
   ══════════════════════════════════════════════════════════════════════════ */

export function ThreeDViewer({ onBack }: ThreeDViewerProps) {
	const { active, loading, error, hands, videoRef, start, stop } = useHandTracking();
	const [rotation, setRotation] = useState<[number, number]>([0, 0]);
	const [scale, setScale] = useState(1);
	const [exploded, setExploded] = useState(false);
	const [label, setLabel] = useState("🖐️ Qo'lni ko'rsating");
	const [pointer, setPointer] = useState<CursorPoint | null>(null);
	const [magneticCursor, setMagneticCursor] = useState<CursorPoint | null>(null);
	const [cursorSnapped, setCursorSnapped] = useState(false);
	const [hovered, setHovered] = useState<PartInfo | null>(null);
	const [selected, setSelected] = useState<PartInfo | null>(null);
	const processor = useRef(new ThreeDGestureProcessor());

	useEffect(() => {
		if (!active) {
			processor.current.reset();
			setPointer(null);
			setLabel("Kamera o'chiq");
			return;
		}
		const frame = processor.current.process(hands);
		setLabel(frame.label);
		switch (frame.action.type) {
			case 'rotate': {
				const { x, y } = frame.action;
				setRotation(value => [value[0] + y * 3.2, value[1] + x * 4]);
				setPointer(null);
				break;
			}
			case 'zoom': {
				const { delta } = frame.action;
				setScale(value => Math.min(2.5, Math.max(0.35, value + delta * 2.4)));
				setPointer(null);
				break;
			}
			case 'toggle-explode':
				setExploded(value => !value);
				setPointer(null);
				break;
			case 'point':
				setPointer({ x: frame.action.x, y: frame.action.y });
				break;
			default:
				setPointer(null);
		}
	}, [active, hands]);

	useEffect(() => {
		if (!hovered || !pointer) return;
		const timer = window.setTimeout(() => setSelected(hovered), DWELL_MS);
		return () => window.clearTimeout(timer);
	}, [hovered?.id, Boolean(pointer)]);

	const handleTarget = useCallback((part: PartInfo | null, cursor: CursorPoint | null, snapped: boolean) => {
		setHovered(current => current?.id === part?.id ? current : part);
		setMagneticCursor(cursor);
		setCursorSnapped(snapped);
	}, []);

	const resetView = () => {
		setRotation([0, 0]);
		setScale(1);
	};

	return (
		<div style={{ position: 'relative', width: '100%', height: '100vh', background: '#07090d' }}>
			<header style={headerStyle}>
				<div><strong>Gesture Presenter · 3D modul</strong><div style={subtleStyle}>sag_mill_v2.glb · {exploded ? 'sochilgan' : "yig'ilgan"}</div></div>
				<div style={{ display: 'flex', gap: 8 }}>
					<button onClick={() => setExploded(value => !value)} style={buttonStyle}>{exploded ? "Yig'ish" : 'Sochish'}</button>
					<button onClick={resetView} style={buttonStyle}>Kamerani tiklash</button>
					<button onClick={onBack} style={buttonStyle}>← PDF modul</button>
				</div>
			</header>

			<div style={{ position: 'absolute', inset: '58px 0 0' }}>
				<Suspense fallback={<div style={loadingStyle}>3D model yuklanmoqda…</div>}>
					<Canvas camera={{ position: [20, 16, 24], fov: 42 }} dpr={[1, 1.75]}>
						<color attach="background" args={['#07090d']} />
						<ambientLight intensity={1.4} />
						<directionalLight position={[8, 12, 8]} intensity={2.2} />
						<directionalLight position={[-7, 3, -5]} intensity={0.8} color="#7c9cff" />
						<Bounds fit clip margin={4.0}>
							<ExplodableModel exploded={exploded} rotation={rotation} scale={scale} />
						</Bounds>
						<PointerSelector pointer={pointer} onTarget={handleTarget} />
						<SelectionBox object={selected?.object ?? null} />
						<OrbitControls
							makeDefault
							enableDamping
							enableRotate={false}
							enableZoom={false}
						/>
						<Environment preset="warehouse" />
					</Canvas>
				</Suspense>
			</div>

			{/* ── Kursor ── */}
			{magneticCursor && pointer && (
				<div
					style={{
						...cursorStyle,
						left: `${magneticCursor.x * 100}%`,
						top: `${58 + magneticCursor.y * (window.innerHeight - 58)}px`,
						...(cursorSnapped ? cursorSnappedStyle : {}),
					}}
				>
					<span style={cursorInnerDotStyle} />
					{cursorSnapped && <span style={cursorRippleStyle} />}
				</div>
			)}

			{/* ── Hint ── */}
			<div style={hintStyle}>
				{label}
				{hovered && pointer ? ` · ${hovered.name} — ushlab turing` : ''}
			</div>

			{/* ── Metadata Panel ── */}
			{selected && <MetadataPanel part={selected} onClose={() => setSelected(null)} />}

			<HandCameraWidget
				videoRef={videoRef}
				hands={hands.map(hand => ({ handedness: hand.handedness, shape: classifyHandShape(hand.landmarks), landmarks: hand.landmarks, palmCenter: palmCenter(hand.landmarks), indexTip: hand.landmarks[8] }))}
				active={active} loading={loading} error={error} label={label}
				onToggle={() => (active ? stop() : start())}
			/>
		</div>
	);
}


/* ── Metadata Panel ── */
function MetadataPanel({ part, onClose }: { part: PartInfo; onClose: () => void }) {
	const entries = Object.entries(part.metadata).filter(([, value]) => value !== undefined && typeof value !== 'object');

	const identity = entries.filter(([key]) => ['name', 'uuid', 'type'].includes(key));
	const geometry = entries.filter(([key]) => ['vertices', 'triangles', 'dimensions'].includes(key));
	const materials = entries.filter(([key]) => ['material', 'castShadow', 'receiveShadow', 'visible'].includes(key));
	const custom = entries.filter(([key]) => !['name', 'uuid', 'type', 'vertices', 'triangles', 'dimensions', 'material', 'castShadow', 'receiveShadow', 'visible', 'selectableId'].includes(key));

	return (
		<aside style={panelStyle}>
			<div style={panelHeaderStyle}>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={panelAccentLabelStyle}>GLB METADATA</div>
					<strong style={{ fontSize: 14, display: 'block', marginTop: 4 }}>{part.name}</strong>
				</div>
				<button onClick={onClose} style={closeStyle}>×</button>
			</div>

			<div style={panelBodyStyle}>
				<MetadataSection title="Identifikatsiya" entries={identity} />
				{geometry.length > 0 && <MetadataSection title="Geometriya" entries={geometry} />}
				{materials.length > 0 && <MetadataSection title="Material va ko'rinish" entries={materials} />}
				{custom.length > 0 && <MetadataSection title="Qo'shimcha ma'lumotlar" entries={custom} />}
				<div style={{ marginTop: 12 }}>
					<div style={sectionTitleStyle}>Xom JSON</div>
					<pre style={jsonStyle}>{JSON.stringify(part.metadata, null, 2)}</pre>
				</div>
			</div>
		</aside>
	);
}

function MetadataSection({ title, entries }: { title: string; entries: [string, unknown][] }) {
	return (
		<div style={{ marginTop: 12 }}>
			<div style={sectionTitleStyle}>{title}</div>
			<div style={sectionBodyStyle}>
				{entries.map(([key, value]) => (
					<div key={key} style={rowStyle}>
						<span style={rowLabelStyle}>{key}</span>
						<span style={rowValueStyle}>{String(value)}</span>
					</div>
				))}
			</div>
		</div>
	);
}

useGLTF.preload(MODEL_URL);

/* ══════════════════════════════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════════════════════════════ */

const headerStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, right: 0, height: 58, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: '1px solid var(--border)', background: 'rgba(11,13,18,.92)' };
const subtleStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: 11, marginTop: 3 };
const buttonStyle: React.CSSProperties = { padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer' };
const hintStyle: React.CSSProperties = { position: 'absolute', left: 16, bottom: 16, zIndex: 20, padding: '8px 12px', borderRadius: 8, background: 'rgba(11,13,18,.8)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 12 };
const loadingStyle: React.CSSProperties = { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--accent)', fontFamily: 'var(--font-mono)' };

const cursorStyle: React.CSSProperties = {
	position: 'absolute',
	zIndex: 45,
	width: 28,
	height: 28,
	margin: -14,
	pointerEvents: 'none',
	border: '2px solid var(--accent)',
	borderRadius: '50%',
	background: 'rgba(242,183,5,.12)',
	boxShadow: '0 0 18px var(--accent)',
	transition: 'left 100ms linear, top 100ms linear, width 200ms ease, height 200ms ease, margin 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
};

const cursorSnappedStyle: React.CSSProperties = {
	width: 36,
	height: 36,
	margin: -18,
	borderColor: '#35d488',
	boxShadow: '0 0 24px rgba(53,212,136,.5), 0 0 48px rgba(53,212,136,.2)',
	background: 'rgba(53,212,136,.12)',
};

const cursorInnerDotStyle: React.CSSProperties = {
	width: 6,
	height: 6,
	borderRadius: '50%',
	background: 'var(--accent)',
	boxShadow: '0 0 8px var(--accent)',
};

const cursorRippleStyle: React.CSSProperties = {
	position: 'absolute',
	inset: -6,
	borderRadius: '50%',
	border: '1.5px solid rgba(53,212,136,.35)',
	animation: 'cursorRipple 1.2s ease-out infinite',
};

const panelStyle: React.CSSProperties = {
	position: 'absolute',
	zIndex: 46,
	left: 16,
	top: 74,
	width: 340,
	maxHeight: 'calc(100vh - 105px)',
	overflow: 'hidden',
	borderRadius: 14,
	border: '1px solid var(--border)',
	background: 'rgba(14,16,22,.96)',
	boxShadow: '0 20px 60px rgba(0,0,0,.55)',
	backdropFilter: 'blur(16px)',
	fontSize: 12,
	display: 'flex',
	flexDirection: 'column',
	animation: 'panelSlideIn 280ms cubic-bezier(.22,1,.36,1)',
};

const panelHeaderStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'flex-start',
	justifyContent: 'space-between',
	gap: 12,
	padding: '14px 16px 12px',
	borderBottom: '1px solid var(--border)',
	background: 'rgba(27,31,41,.6)',
};

const panelAccentLabelStyle: React.CSSProperties = {
	color: 'var(--accent)',
	fontSize: 9,
	letterSpacing: 1.5,
	fontFamily: 'var(--font-mono)',
	textTransform: 'uppercase',
};

const panelBodyStyle: React.CSSProperties = {
	overflow: 'auto',
	padding: '4px 16px 16px',
};

const sectionTitleStyle: React.CSSProperties = {
	fontSize: 9,
	letterSpacing: 1.2,
	textTransform: 'uppercase',
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-mono)',
	marginBottom: 8,
	paddingTop: 4,
};

const sectionBodyStyle: React.CSSProperties = {
	borderRadius: 8,
	border: '1px solid var(--border)',
	background: 'rgba(27,31,41,.45)',
	overflow: 'hidden',
};

const closeStyle: React.CSSProperties = { border: 0, background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '2px 4px', borderRadius: 6 };

const rowStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: '110px 1fr',
	gap: 8,
	padding: '7px 10px',
	borderBottom: '1px solid rgba(38,43,54,.7)',
	alignItems: 'baseline',
};

const rowLabelStyle: React.CSSProperties = {
	color: 'var(--text-muted)',
	fontSize: 11,
	fontFamily: 'var(--font-mono)',
};

const rowValueStyle: React.CSSProperties = {
	color: 'var(--text)',
	fontSize: 11,
	fontWeight: 500,
	wordBreak: 'break-all',
};

const jsonStyle: React.CSSProperties = {
	whiteSpace: 'pre-wrap',
	overflowWrap: 'anywhere',
	color: 'var(--text-muted)',
	fontSize: 10,
	lineHeight: 1.5,
	background: 'rgba(27,31,41,.45)',
	border: '1px solid var(--border)',
	borderRadius: 8,
	padding: '10px 12px',
	marginTop: 6,
};
