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

export interface ThreeDViewerProps {
  onBack?: () => void;
  modelUrl?: string;
  modelName?: string;
  availableModels?: StoredFile[];
  onSelectModel?: (file: StoredFile) => void;
  // Sync & Presentation Props
  rotation?: [number, number];
  scale?: number;
  exploded?: boolean;
  onRotationChange?: (rotation: [number, number]) => void;
  onScaleChange?: (scale: number) => void;
  onExplodeChange?: (exploded: boolean) => void;
  isPresenter?: boolean;
  hands?: any[];
  gestureActive?: boolean;
  onToggleTheater?: () => void;
  isTheaterMode?: boolean;
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
        (item) => item.name || item.type,
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

/* ── Explodable Model Component ── */
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
    const damping = 1 - Math.exp(-5.5 * delta);
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

/* ── Selection Bounding Box ── */
function SelectionBox({ object }: { object: THREE.Object3D | null }) {
  const helper = useMemo(() => (object ? new THREE.BoxHelper(object, 0x00e5ff) : null), [object]);
  useFrame(() => helper?.update());
  useEffect(() => () => helper?.dispose(), [helper]);
  return helper ? <primitive object={helper} /> : null;
}

/* ── Pointer Selector (raycast + magnet snapping) ── */
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
      snapped,
    );
  });
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   Main Interactive 3D Viewer
   ══════════════════════════════════════════════════════════════════════════ */
export function ThreeDViewer({
  onBack,
  modelUrl = '/models/sag_mill_v2.glb',
  modelName = '3D Model',
  availableModels = [],
  onSelectModel,
  rotation: controlledRotation,
  scale: controlledScale,
  exploded: controlledExploded,
  onRotationChange,
  onScaleChange,
  onExplodeChange,
  isPresenter = true,
  hands: externalHands,
  gestureActive = false,
  onToggleTheater,
  isTheaterMode = false,
}: ThreeDViewerProps) {
  // Local fallback hand tracking if not passed from parent
  const internalHandTracking = useHandTracking();
  const effectiveHands = externalHands || (gestureActive ? internalHandTracking.hands : []);
  const effectiveActive = gestureActive || internalHandTracking.active;

  // Local state if not controlled
  const [internalRotation, setInternalRotation] = useState<[number, number]>([0, 0]);
  const [internalScale, setInternalScale] = useState(1);
  const [internalExploded, setInternalExploded] = useState(false);

  const rotation = controlledRotation !== undefined ? controlledRotation : internalRotation;
  const scale = controlledScale !== undefined ? controlledScale : internalScale;
  const exploded = controlledExploded !== undefined ? controlledExploded : internalExploded;

  const [label, setLabel] = useState("🖐️ Qo'lni ko'rsating");
  const [pointer, setPointer] = useState<CursorPoint | null>(null);
  const [magneticCursor, setMagneticCursor] = useState<CursorPoint | null>(null);
  const [cursorSnapped, setCursorSnapped] = useState(false);
  const [hovered, setHovered] = useState<PartInfo | null>(null);
  const [selected, setSelected] = useState<PartInfo | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const processor = useRef(new ThreeDGestureProcessor());

  const updateRotation = useCallback(
    (newRot: [number, number] | ((prev: [number, number]) => [number, number])) => {
      const resolved = typeof newRot === 'function' ? newRot(rotation) : newRot;
      if (onRotationChange) onRotationChange(resolved);
      else setInternalRotation(resolved);
    },
    [rotation, onRotationChange],
  );

  const updateScale = useCallback(
    (newScale: number | ((prev: number) => number)) => {
      const resolved = typeof newScale === 'function' ? newScale(scale) : newScale;
      const clamped = Math.min(3.5, Math.max(0.3, resolved));
      if (onScaleChange) onScaleChange(clamped);
      else setInternalScale(clamped);
    },
    [scale, onScaleChange],
  );

  const updateExploded = useCallback(
    (newExploded: boolean | ((prev: boolean) => boolean)) => {
      const resolved = typeof newExploded === 'function' ? newExploded(exploded) : newExploded;
      if (onExplodeChange) onExplodeChange(resolved);
      else setInternalExploded(resolved);
    },
    [exploded, onExplodeChange],
  );

  // Reset states on model URL change
  useEffect(() => {
    setSelected(null);
    setHovered(null);
    updateRotation([0, 0]);
    updateScale(1);
    updateExploded(false);
  }, [modelUrl]);

  // AI Gesture Processor loop
  useEffect(() => {
    if (!effectiveActive || !effectiveHands || effectiveHands.length === 0) {
      processor.current.reset();
      setPointer(null);
      setLabel(effectiveActive ? "🖐️ Qo'lingizni ko'rsating" : "AI Gesture o'chiq");
      return;
    }

    const frame = processor.current.process(effectiveHands);
    setLabel(frame.label);

    if (!isPresenter) return; // Only presenter can rotate/zoom for everyone

    switch (frame.action.type) {
      case 'rotate': {
        const { x, y } = frame.action;
        updateRotation((val) => [val[0] + y * 2.8, val[1] + x * 3.5]);
        setPointer(null);
        break;
      }
      case 'zoom': {
        const { delta } = frame.action;
        updateScale((val) => val + delta * 1.8);
        setPointer(null);
        break;
      }
      case 'toggle-explode':
        updateExploded((val) => !val);
        setPointer(null);
        break;
      case 'point':
        setPointer({ x: frame.action.x, y: frame.action.y });
        break;
      default:
        setPointer(null);
    }
  }, [effectiveActive, effectiveHands, isPresenter, updateRotation, updateScale, updateExploded]);

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
    [],
  );

  const resetView = () => {
    updateRotation([0, 0]);
    updateScale(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 99999 : 1,
        width: '100%',
        height: '100%',
        background: '#07090e',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top Zoom-Style Control Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'rgba(11, 15, 25, 0.88)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                color: 'var(--cyan, #00e5ff)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 0.5,
              }}
            >
              🧊 3D MODEL
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--f-mono)',
                padding: '2px 8px',
                borderRadius: 4,
                background: exploded ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0, 229, 255, 0.12)',
                color: exploded ? '#f59e0b' : '#00e5ff',
                border: `1px solid ${exploded ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 229, 255, 0.25)'}`,
              }}
            >
              {exploded ? "Qismlarga sochilgan" : "Yig'ilgan"}
            </span>
          </div>
          <div
            style={{
              color: 'var(--text-muted, #94a3b8)',
              fontSize: 12,
              fontFamily: 'var(--f-mono)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 220,
            }}
          >
            {modelName}
          </div>

          {/* Model Switcher if multiple 3D models available */}
          {availableModels.length > 1 && onSelectModel && (
            <select
              value={availableModels.find((m) => m.url === modelUrl || `/models/${m.fileName}` === modelUrl)?.id || ''}
              onChange={(e) => {
                const target = availableModels.find((m) => m.id === e.target.value);
                if (target) onSelectModel(target);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: 11,
                fontFamily: 'var(--f-mono)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id} style={{ background: '#0f172a' }}>
                  {m.originalName}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isPresenter && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderColor: exploded ? '#f59e0b' : undefined,
                color: exploded ? '#f59e0b' : undefined,
              }}
              onClick={() => updateExploded((val) => !val)}
              title="Qismlarga sochish yoki yig'ish"
            >
              {exploded ? "⚙️ Yig'ish" : "💥 Sochish"}
            </button>
          )}

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '4px 8px' }}
            onClick={() => updateScale((val) => Math.min(3.5, val + 0.2))}
            title="Kattalashtirish (Zoom +)"
          >
            🔍+
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '4px 8px' }}
            onClick={() => updateScale((val) => Math.max(0.3, val - 0.2))}
            title="Kichiklashtirish (Zoom -)"
          >
            🔍-
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={resetView}
            title="Kamerani markazlashtirish va moslash"
          >
            ↺ Moslash
          </button>

          {onToggleTheater && (
            <button
              type="button"
              className={`btn ${isTheaterMode ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={onToggleTheater}
              title={isTheaterMode ? "Yon panelni ochish" : "Keng ekran rejimi (Chatni yopish)"}
            >
              🗖 {isTheaterMode ? "Yon panel" : "Keng ekran"}
            </button>
          )}

          <button
            type="button"
            className={`btn ${isFullscreen ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            style={{ fontSize: 11, padding: '4px 10px' }}
            onClick={toggleFullscreen}
            title="Butun ekran rejimiga o'tish (Zoom style)"
          >
            ⛶ {isFullscreen ? "Kichraytirish" : "To'liq ekran"}
          </button>

          {onBack && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={onBack}
            >
              ← Orqaga
            </button>
          )}
        </div>
      </div>

      {/* ── 3D Canvas Viewport ── */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        <Suspense
          fallback={
            <div style={loadingStyle}>
              <div style={{ fontSize: 36, marginBottom: 12, animation: 'pulse 1.2s infinite' }}>🧊</div>
              <div style={{ fontSize: 13, color: 'var(--cyan, #00e5ff)' }}>3D model yuklanmoqda…</div>
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 6, 12], fov: 45 }}
            dpr={[1, 2]}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <color attach="background" args={['#07090e']} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 15, 10]} intensity={2.4} />
            <directionalLight position={[-10, 5, -8]} intensity={1.0} color="#7c9cff" />
            <directionalLight position={[0, -10, 5]} intensity={0.5} />

            {/* Optimal Bounds margin=1.15 so 3D models fill the entire screen nicely */}
            <Bounds fit clip margin={1.15}>
              <ExplodableModel
                url={modelUrl}
                exploded={exploded}
                rotation={rotation}
                scale={scale}
              />
            </Bounds>

            <PointerSelector pointer={pointer} onTarget={handleTarget} />
            <SelectionBox object={selected?.object ?? null} />

            {/* OrbitControls enables seamless mouse/finger rotation & zoom */}
            <OrbitControls
              makeDefault
              enableDamping
              dampingFactor={0.06}
              enableRotate={true}
              enableZoom={true}
              enablePan={true}
              minDistance={1}
              maxDistance={100}
            />
            <Environment preset="warehouse" />
          </Canvas>
        </Suspense>

        {/* ── Magnetic Laser Cursor ── */}
        {magneticCursor && pointer && (
          <div
            style={{
              ...cursorStyle,
              left: `${magneticCursor.x * 100}%`,
              top: `${magneticCursor.y * 100}%`,
              ...(cursorSnapped ? cursorSnappedStyle : {}),
            }}
          >
            <span style={cursorInnerDotStyle} />
            {cursorSnapped && <span style={cursorRippleStyle} />}
          </div>
        )}

        {/* ── AI Gesture Live Status Hint ── */}
        {effectiveActive && (
          <div style={hintStyle}>
            <div style={{ color: 'var(--cyan, #00e5ff)', fontWeight: 600 }}>{label}</div>
            {hovered && pointer ? (
              <div style={{ color: '#f59e0b', marginTop: 2, fontSize: 11 }}>
                🎯 {hovered.name} — ma'lumotni ochish uchun ushlab turing
              </div>
            ) : null}
          </div>
        )}

        {/* ── Metadata Details Panel ── */}
        {selected && <MetadataPanel part={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

/* ── Metadata Details Slide-In Panel ── */
function MetadataPanel({ part, onClose }: { part: PartInfo; onClose: () => void }) {
  const entries = Object.entries(part.metadata).filter(
    ([, value]) => value !== undefined && typeof value !== 'object',
  );

  const identity = entries.filter(([key]) => ['name', 'uuid', 'type'].includes(key));
  const geometry = entries.filter(([key]) => ['vertices', 'triangles', 'dimensions'].includes(key));
  const materials = entries.filter(([key]) =>
    ['material', 'castShadow', 'receiveShadow', 'visible'].includes(key),
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
      ].includes(key),
  );

  return (
    <aside style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={panelAccentLabelStyle}>OKMK 3D METADATA</div>
          <strong style={{ fontSize: 13, display: 'block', marginTop: 3, color: '#fff' }}>
            {part.name}
          </strong>
        </div>
        <button type="button" onClick={onClose} style={closeStyle}>
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
    <div style={{ marginTop: 10 }}>
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
const loadingStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--cyan, #00e5ff)',
  fontFamily: 'var(--f-mono, monospace)',
  fontSize: 14,
};

const hintStyle: React.CSSProperties = {
  position: 'absolute',
  left: 16,
  bottom: 16,
  zIndex: 20,
  padding: '8px 14px',
  borderRadius: 8,
  background: 'rgba(10, 13, 22, 0.88)',
  border: '1px solid rgba(0, 229, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  fontFamily: 'var(--f-mono, monospace)',
  fontSize: 11,
  maxWidth: 320,
  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
};

const cursorStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 45,
  width: 24,
  height: 24,
  margin: -12,
  pointerEvents: 'none',
  border: '2px solid var(--cyan, #00e5ff)',
  borderRadius: '50%',
  background: 'rgba(0, 229, 255, 0.12)',
  boxShadow: '0 0 16px var(--cyan, #00e5ff)',
  transition:
    'left 80ms linear, top 80ms linear, width 180ms ease, height 180ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cursorSnappedStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  margin: -16,
  borderColor: '#10b981',
  boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
  background: 'rgba(16, 185, 129, 0.18)',
};

const cursorInnerDotStyle: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: 'var(--cyan, #00e5ff)',
  boxShadow: '0 0 6px var(--cyan, #00e5ff)',
};

const cursorRippleStyle: React.CSSProperties = {
  position: 'absolute',
  inset: -5,
  borderRadius: '50%',
  border: '1.5px solid rgba(16, 185, 129, 0.4)',
  animation: 'cursorRipple 1.2s ease-out infinite',
};

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  zIndex: 46,
  left: 16,
  top: 16,
  width: 320,
  maxHeight: 'calc(100% - 32px)',
  overflow: 'hidden',
  borderRadius: 12,
  border: '1px solid rgba(0, 229, 255, 0.25)',
  background: 'rgba(12, 16, 28, 0.94)',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(16px)',
  fontSize: 12,
  display: 'flex',
  flexDirection: 'column',
};

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
  padding: '12px 14px 10px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(22, 30, 51, 0.6)',
};

const panelAccentLabelStyle: React.CSSProperties = {
  color: 'var(--cyan, #00e5ff)',
  fontSize: 9,
  letterSpacing: 1.2,
  fontFamily: 'var(--f-mono, monospace)',
  fontWeight: 700,
  textTransform: 'uppercase',
};

const panelBodyStyle: React.CSSProperties = {
  overflow: 'auto',
  padding: '6px 14px 14px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 1.0,
  textTransform: 'uppercase',
  color: 'var(--text-muted, #94a3b8)',
  fontFamily: 'var(--f-mono, monospace)',
  fontWeight: 600,
  marginBottom: 6,
  paddingTop: 4,
};

const sectionBodyStyle: React.CSSProperties = {
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(22, 30, 51, 0.45)',
  overflow: 'hidden',
};

const closeStyle: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: 'var(--text-muted, #94a3b8)',
  cursor: 'pointer',
  fontSize: 14,
  padding: '2px 4px',
  borderRadius: 4,
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '100px 1fr',
  gap: 8,
  padding: '6px 8px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  alignItems: 'baseline',
};

const rowLabelStyle: React.CSSProperties = {
  color: 'var(--text-muted, #94a3b8)',
  fontSize: 10,
  fontFamily: 'var(--f-mono, monospace)',
};

const rowValueStyle: React.CSSProperties = {
  color: 'var(--text-pri, #e2e8f0)',
  fontSize: 11,
  fontWeight: 500,
  wordBreak: 'break-all',
};
