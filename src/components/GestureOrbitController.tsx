import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface GestureOrbitControllerProps {
	controlsRef: React.RefObject<OrbitControlsImpl>;
	rotationDelta: { x: number; y: number } | null;
	zoomDelta: number | null;
}

const ROTATION_SPEED = 4.2;
const ZOOM_SPEED = 2.8;

/**
 * Bridges gesture rotation / zoom deltas into the OrbitControls instance
 * so that gesture-driven movement and mouse/touch movement share the same
 * camera rig without conflicting.
 */
export function GestureOrbitController({
	controlsRef,
	rotationDelta,
	zoomDelta,
}: GestureOrbitControllerProps) {

	/* Smooth accumulators – we lerp towards the target each frame so the
	   camera movement feels fluid rather than jittery. */
	const accAzimuth = useRef(0);
	const accPolar = useRef(0);
	const accZoom = useRef(0);

	/* When new gesture data arrives, push it into the accumulator */
	useEffect(() => {
		if (rotationDelta) {
			accAzimuth.current += rotationDelta.x * ROTATION_SPEED;
			accPolar.current += rotationDelta.y * ROTATION_SPEED;
		}
	}, [rotationDelta]);

	useEffect(() => {
		if (zoomDelta !== null) {
			accZoom.current += zoomDelta * ZOOM_SPEED;
		}
	}, [zoomDelta]);

	useFrame((_, delta) => {
		const controls = controlsRef.current;
		if (!controls) return;

		const damping = 1 - Math.exp(-8 * delta);

		/* ── Rotation ── */
		if (Math.abs(accAzimuth.current) > 1e-5 || Math.abs(accPolar.current) > 1e-5) {
			const az = accAzimuth.current * damping;
			const po = accPolar.current * damping;

			// Allow full 360° azimuthal rotation
			controls.minAzimuthAngle = -Infinity;
			controls.maxAzimuthAngle = Infinity;

			// Use the unofficial but stable rotateLeft / rotateUp methods
			// available on three-stdlib OrbitControls
			type RotatablControls = {
				rotateLeft: (angle: number) => void;
				rotateUp: (angle: number) => void;
			};
			(controls as unknown as RotatablControls).rotateLeft(az);
			(controls as unknown as RotatablControls).rotateUp(po);

			accAzimuth.current -= az;
			accPolar.current -= po;
		}

		/* ── Zoom (dolly) ── */
		if (Math.abs(accZoom.current) > 1e-5) {
			const z = accZoom.current * damping;

			// Move camera along its forward vector (dolly)
			type DollyControls = {
				dollyIn: (scale: number) => void;
				dollyOut: (scale: number) => void;
			};

			const factor = Math.exp(-z);
			if (z > 0) {
				(controls as unknown as DollyControls).dollyIn(factor);
			} else {
				(controls as unknown as DollyControls).dollyOut(1 / factor);
			}

			accZoom.current -= z;
		}

		controls.update();
	});

	return null;
}
