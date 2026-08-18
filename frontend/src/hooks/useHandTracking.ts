import { useCallback, useEffect, useRef, useState } from 'react';
import {
	FilesetResolver,
	HandLandmarker,
	type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { Landmark } from '../types/gesture';

export interface RawHand {
	handedness: 'Left' | 'Right';
	landmarks: Landmark[];
}

export interface HandTrackingState {
	active: boolean;
	loading: boolean;
	error: string | null;
	hands: RawHand[];
	videoRef: React.RefObject<HTMLVideoElement>;
	start: () => void;
	stop: () => void;
}

const MODEL_URL =
	'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const WASM_URL =
	'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

export function useHandTracking(): HandTrackingState {
	const videoRef = useRef<HTMLVideoElement>(null);
	const landmarkerRef = useRef<HandLandmarker | null>(null);
	const rafRef = useRef<number>(0);
	const streamRef = useRef<MediaStream | null>(null);

	const [active, setActive] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hands, setHands] = useState<RawHand[]>([]);

	const stop = useCallback(() => {
		cancelAnimationFrame(rafRef.current);
		streamRef.current?.getTracks().forEach(t => t.stop());
		streamRef.current = null;
		setActive(false);
		setHands([]);
	}, []);

	const start = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 640 },
					height: { ideal: 480 },
					frameRate: { ideal: 24, max: 30 },
				},
				audio: false,
			});
			streamRef.current = stream;
			const video = videoRef.current;
			if (!video) throw new Error('Video element mavjud emas');
			video.srcObject = stream;
			await video.play();

			if (!landmarkerRef.current) {
				const vision = await FilesetResolver.forVisionTasks(WASM_URL);
				const options = {
					baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' as const },
					runningMode: 'VIDEO' as const,
					numHands: 2,
					minHandDetectionConfidence: 0.5,
					minHandPresenceConfidence: 0.5,
					minTrackingConfidence: 0.5,
				};
				try {
					landmarkerRef.current = await HandLandmarker.createFromOptions(
						vision,
						options,
					);
				} catch {
					landmarkerRef.current = await HandLandmarker.createFromOptions(
						vision,
						{
							...options,
							baseOptions: { ...options.baseOptions, delegate: 'CPU' },
						},
					);
				}
			}

			setActive(true);
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "Kameraga ulanib bo'lmadi";
			if (msg.includes('Permission') || msg.includes('NotAllowed')) {
				setError(
					'Kameraga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.',
				);
			} else {
				setError(msg);
			}
			stop();
		} finally {
			setLoading(false);
		}
	}, [stop]);

	useEffect(() => {
		if (!active) return;
		let lastTimestamp = -1;

		const detect = () => {
			const video = videoRef.current;
			const landmarker = landmarkerRef.current;
			if (video && landmarker && video.readyState >= 2) {
				const now = performance.now();
				if (now !== lastTimestamp) {
					lastTimestamp = now;
					const result: HandLandmarkerResult = landmarker.detectForVideo(
						video,
						now,
					);
					const nextHands: RawHand[] = result.landmarks.map((landmarks, i) => {
						const mirrored = landmarks.map(p => ({
							x: 1 - p.x,
							y: p.y,
							z: p.z,
						}));
						const handednessLabel = result.handednesses[i]?.[0]?.categoryName;
						return {
							handedness: handednessLabel === 'Left' ? 'Right' : 'Left', // mirror flips L/R too
							landmarks: mirrored,
						};
					});
					setHands(nextHands);
				}
			}
			rafRef.current = requestAnimationFrame(detect);
		};

		rafRef.current = requestAnimationFrame(detect);
		return () => cancelAnimationFrame(rafRef.current);
	}, [active]);

	useEffect(() => () => stop(), [stop]);

	return { active, loading, error, hands, videoRef, start, stop };
}
