import { Bounds, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useHandTracking } from '../hooks/useHandTracking';
import { classifyHandShape, palmCenter } from '../utils/handShape';
import { ThreeDGestureProcessor } from '../utils/threeDGestureProcessor';
import { HandCameraWidget } from './HandCameraWidget';
import { StoredFile } from '../types/file';

const DWELL_MS = 450;
const MAGNET_RADIUS = 0.13;

interface ThreeDViewerProps {
  onBack: () => void;
  modelUrl?: string;
  modelName?: string;
  availableModels?: StoredFile[];
  onSelectModel?: (file: StoredFile) => void;
}

interface CursorPoint {
  x: number;
  y: number;
}

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
  while (current) {
    hierarchy.unshift(current);
    current = current.parent;
  }
  const embedded = Object.assign({}, ...hierarchy.map((item) => item.userData));
  const mesh = object instanceof THREE.Mesh ? object : null;
  const materials = mesh
    ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map(
        (item) => item.name || item.type
      )
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
  url,
  exploded,
  rotation,
  scale,
}: {
  url: string;
  exploded: boolean;
  rotation: [number, number];
  scale: number;
}) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const parts = useMemo<ExplodablePart[]>(() => {
    scene.updateWorldMatrix(true, true);
    const modelBox = new THREE.Box3().setFromObject(scene);
    const center = modelBox.getCenter(new THREE.Vector3());
    const diagonal = Math.max(modelBox.getSize(new THREE.Vector3()).length(), 1);
    const result: ExplodablePart[] = [];
    scene.traverse((object) => {
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
  const helper = useMemo(() => (object ? new THREE.BoxHelper(object, 0x00e5ff) : null), [object]);
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
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.visible && object.userData.selectableId)
        targets.push(object);
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
    onTarget(
      target
        ? {
            id,
            name: target.name || 'Nomsiz detal',
            object: target,
            metadata: metadataFor(target),
          }
        : null,
      cursor,
      snapped
    );
  });
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   Main ThreeDViewer
   ══════════════════════════════════════════════════════════════════════════ */

export function ThreeDViewer({
  onBack,
  modelUrl = '/models/sag_mill_v2.glb',
  modelName = 'sag_mill_v2.glb',
  availableModels = [],
  onSelectModel,
}: ThreeDViewerProps) {
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

  // Reset states when model URL changes
  useEffect(() => {
    setSelected(null);
    setHovered(null);
    setRotation([0, 0]);
    setScale(1);
    setExploded(false);
  }, [modelUrl]);

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
        setRotation((value) => [value[0] + y * 3.2, value[1] + x * 4]);
        setPointer(null);
        break;
      }
      case 'zoom': {
        const { delta } = frame.action;
        setScale((value) => Math.min(2.5, Math.max(0.35, value + delta * 2.4)));
        setPointer(null);
        break;
      }
      case 'toggle-explode':
        setExploded((value) => !value);
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

  const handleTarget = useCallback(
    (part: PartInfo | null, cursor: CursorPoint | null, snapped: boolean) => {
      setHovered((current) => (current?.id === part?.id ? current : part));
      setMagneticCursor(cursor);
      setCursorSnapped(snapped);
    },
    []
  );

  const resetView = () => {
    setRotation([0, 0]);
    setScale(1);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 64px)',
        background: '#07090e',
        overflow: 'hidden',
      }}
    >
      {/* ── Top Bar Controls ── */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: 14 }}>
                OKMK 3D DIGITAL TWIN
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: exploded ? 'var(--amber-soft)' : 'var(--cyan-soft)',
                  color: exploded ? 'var(--amber)' : 'var(--cyan)',
                  border: `1px solid ${exploded ? 'var(--amber)' : 'var(--cyan)'}`,
                }}
              >
                {exploded ? "Qismlarga sochilgan" : "Yig'ilgan holatda"}
              </span>
            </div>
            <div style={subtleStyle}>{modelName}</div>
          </div>

          {/* Model Switcher dropdown if multiple models available */}
          {availableModels.length > 1 && onSelectModel && (
            <select
              value={availableModels.find((m) => m.url === modelUrl || `/models/${m.fileName}` === modelUrl)?.id || ''}
              onChange={(e) => {
                const target = availableModels.find((m) => m.id === e.target.value);
                if (target) onSelectModel(target);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                color: '#fff',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.originalName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setExploded((value) => !value)}
            style={{
              ...buttonStyle,
              borderColor: exploded ? 'var(--amber)' : 'var(--border)',
              color: exploded ? 'var(--amber)' : 'var(--text-main)',
            }}
          >
            {exploded ? "⚙️ Yig'ish (Assemble)" : "💥 Sochish (Explode)"}
          </button>
          <button onClick={resetView} style={buttonStyle}>
            ↺ Kamerani tiklash
          </button>
          <button
            onClick={onBack}
            style={{
              ...buttonStyle,
              background: 'var(--cyan-soft)',
              borderColor: 'var(--cyan)',
              color: 'var(--cyan)',
            }}
          >
            ← Kutubxona
          </button>
        </div>
      </div>

      {/* ── 3D Canvas ── */}
      <div style={{ position: 'absolute', inset: '58px 0 0' }}>
        <Suspense
          fallback={
            <div style={loadingStyle}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧊</div>
              <div>3D model yuklanmoqda…</div>
            </div>
          }
        >
          <Canvas camera={{ position: [20, 16, 24], fov: 42 }} dpr={[1, 1.75]}>
            <color attach="background" args={['#07090e']} />
            <ambientLight intensity={1.4} />
            <directionalLight position={[8, 12, 8]} intensity={2.2} />
            <directionalLight position={[-7, 3, -5]} intensity={0.8} color="#7c9cff" />
            <Bounds fit clip margin={3.5}>
              <ExplodableModel
                url={modelUrl}
                exploded={exploded}
                rotation={rotation}
                scale={scale}
              />
            </Bounds>
            <PointerSelector pointer={pointer} onTarget={handleTarget} />
            <SelectionBox object={selected?.object ?? null} />
            <OrbitControls makeDefault enableDamping enableRotate={false} enableZoom={false} />
            <Environment preset="warehouse" />
          </Canvas>
        </Suspense>
      </div>

      {/* ── Magnetic Laser Cursor ── */}
      {magneticCursor && pointer && (
        <div
          style={{
            ...cursorStyle,
            left: `${magneticCursor.x * 100}%`,
            top: `${58 + magneticCursor.y * (window.innerHeight - 58 - 64)}px`,
            ...(cursorSnapped ? cursorSnappedStyle : {}),
          }}
        >
          <span style={cursorInnerDotStyle} />
          {cursorSnapped && <span style={cursorRippleStyle} />}
        </div>
      )}

      {/* ── Gesture Status & Selection Hint ── */}
      <div style={hintStyle}>
        <div style={{ color: active ? 'var(--cyan)' : 'var(--text-muted)' }}>{label}</div>
        {hovered && pointer ? (
          <div style={{ color: 'var(--amber)', marginTop: 2 }}>
            🎯 {hovered.name} — ma'lumotni ochish uchun ushlab turing
          </div>
        ) : null}
      </div>

      {/* ── Metadata Panel ── */}
      {selected && <MetadataPanel part={selected} onClose={() => setSelected(null)} />}

      {/* ── Camera Widget ── */}
      <HandCameraWidget
        videoRef={videoRef}
        hands={hands.map((hand) => ({
          handedness: hand.handedness,
          shape: classifyHandShape(hand.landmarks),
          landmarks: hand.landmarks,
          palmCenter: palmCenter(hand.landmarks),
          indexTip: hand.landmarks[8],
        }))}
        active={active}
        loading={loading}
        error={error}
        label={label}
        onToggle={() => (active ? stop() : start())}
      />
    </div>
  );
}

/* ── Metadata Panel ── */
function MetadataPanel({ part, onClose }: { part: PartInfo; onClose: () => void }) {
  const entries = Object.entries(part.metadata).filter(
    ([, value]) => value !== undefined && typeof value !== 'object'
  );

  const identity = entries.filter(([key]) => ['name', 'uuid', 'type'].includes(key));
  const geometry = entries.filter(([key]) => ['vertices', 'triangles', 'dimensions'].includes(key));
  const materials = entries.filter(([key]) =>
    ['material', 'castShadow', 'receiveShadow', 'visible'].includes(key)
  );
  const custom = entries.filter(
    ([key]) =>
      ![
        'name',
        'uuid',
        'type',
        'vertices',
        'triangles',
        'dimensions',
        'material',
        'castShadow',
        'receiveShadow',
        'visible',
        'selectableId',
      ].includes(key)
  );

  return (
    <aside style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={panelAccentLabelStyle}>OKMK 3D METADATA</div>
          <strong style={{ fontSize: 14, display: 'block', marginTop: 4, color: '#fff' }}>
            {part.name}
          </strong>
        </div>
        <button onClick={onClose} style={closeStyle}>
          ✕
        </button>
      </div>

      <div style={panelBodyStyle}>
        <MetadataSection title="Identifikatsiya" entries={identity} />
        {geometry.length > 0 && <MetadataSection title="Geometriya" entries={geometry} />}
        {materials.length > 0 && (
          <MetadataSection title="Material va ko'rinish" entries={materials} />
        )}
        {custom.length > 0 && (
          <MetadataSection title="Qo'shimcha ma'lumotlar" entries={custom} />
        )}
        <div style={{ marginTop: 12 }}>
          <div style={sectionTitleStyle}>Xom JSON</div>
          <pre style={jsonStyle}>{JSON.stringify(part.metadata, null, 2)}</pre>
        </div>
      </div>
    </aside>
  );
}

function MetadataSection({
  title,
  entries,
}: {
  title: string;
  entries: [string, unknown][];
}) {
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

/* ══════════════════════════════════════════════════════════════════════════
   Styles
   ══════════════════════════════════════════════════════════════════════════ */

const headerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 58,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 20px',
  borderBottom: '1px solid var(--border)',
  background: 'rgba(10, 13, 22, 0.92)',
  backdropFilter: 'blur(12px)',
};

const subtleStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  marginTop: 2,
};

const buttonStyle: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-surface-2)',
  color: 'var(--text-main)',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  fontWeight: 500,
};

const hintStyle: React.CSSProperties = {
  position: 'absolute',
  left: 20,
  bottom: 20,
  zIndex: 20,
  padding: '10px 16px',
  borderRadius: 10,
  background: 'rgba(10, 13, 22, 0.88)',
  border: '1px solid var(--border)',
  backdropFilter: 'blur(10px)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  maxWidth: 360,
};

const loadingStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--cyan)',
  fontFamily: 'var(--font-mono)',
  fontSize: 14,
};

const cursorStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 45,
  width: 28,
  height: 28,
  margin: -14,
  pointerEvents: 'none',
  border: '2px solid var(--cyan)',
  borderRadius: '50%',
  background: 'rgba(0, 229, 255, 0.12)',
  boxShadow: '0 0 18px var(--cyan)',
  transition:
    'left 100ms linear, top 100ms linear, width 200ms ease, height 200ms ease, margin 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cursorSnappedStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  margin: -18,
  borderColor: '#10b981',
  boxShadow: '0 0 24px rgba(16, 185, 129, 0.5), 0 0 48px rgba(16, 185, 129, 0.2)',
  background: 'rgba(16, 185, 129, 0.15)',
};

const cursorInnerDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--cyan)',
  boxShadow: '0 0 8px var(--cyan)',
};

const cursorRippleStyle: React.CSSProperties = {
  position: 'absolute',
  inset: -6,
  borderRadius: '50%',
  border: '1.5px solid rgba(16, 185, 129, 0.4)',
  animation: 'cursorRipple 1.2s ease-out infinite',
};

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 46,
  left: 20,
  top: 74,
  width: 350,
  maxHeight: 'calc(100vh - 160px)',
  overflow: 'hidden',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-bright)',
  background: 'rgba(12, 16, 28, 0.96)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65), var(--cyan-glow)',
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
  padding: '14px 18px 12px',
  borderBottom: '1px solid var(--border)',
  background: 'rgba(22, 30, 51, 0.6)',
};

const panelAccentLabelStyle: React.CSSProperties = {
  color: 'var(--cyan)',
  fontSize: 10,
  letterSpacing: 1.5,
  fontFamily: 'var(--font-mono)',
  fontWeight: 600,
  textTransform: 'uppercase',
};

const panelBodyStyle: React.CSSProperties = {
  overflow: 'auto',
  padding: '8px 18px 18px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)',
  fontWeight: 600,
  marginBottom: 8,
  paddingTop: 4,
};

const sectionBodyStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'rgba(22, 30, 51, 0.45)',
  overflow: 'hidden',
};

const closeStyle: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: 16,
  padding: '2px 6px',
  borderRadius: 6,
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '110px 1fr',
  gap: 8,
  padding: '7px 10px',
  borderBottom: '1px solid rgba(56, 189, 248, 0.08)',
  alignItems: 'baseline',
};

const rowLabelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
};

const rowValueStyle: React.CSSProperties = {
  color: 'var(--text-main)',
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
  background: 'rgba(22, 30, 51, 0.45)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
  marginTop: 6,
};
