import type { RawHand } from '../hooks/useHandTracking';
import type {
	GestureFrame,
	HandReading,
	HandShape,
	PresentationAction,
} from '../types/gesture';
import { classifyHandShape, palmCenter } from './handShape';

const HOLD_FRAMES_TO_CONFIRM = 3;
const SWIPE_VELOCITY = 0.045;
const SWIPE_COOLDOWN_MS = 650;
const TWO_HAND_ZOOM_SENSITIVITY = 3.2;

interface PerHandState {
	candidateShape: HandShape;
	holdFrames: number;
	confirmedShape: HandShape;
	prevPalm: { x: number; y: number } | null;
}

function labelFor(shape: HandShape, twoHandZoom: boolean): string {
	if (twoHandZoom) return "🤲 Ikki qo'l — Zoom";
	switch (shape) {
		case 'open_palm':
			return "✋ Qo'lni silkiting — Slayd almashtirish";
		case 'fist':
			return "✊ Musht — Boshlang'ich holatga qaytarish";
		case 'pointing':
			return "☝️ Ko'rsatkich — Lazer kursor";
		case 'pinch':
			return "🤏 Chimchilash — zoom uchun 2 qo'l ishlating";
		default:
			return "🖐️ Qo'lni ko'rsating";
	}
}

export class GestureProcessor {
	private handStates = new Map<'Left' | 'Right', PerHandState>();
	private lastSwipeAt = 0;
	private prevTwoHandDistance: number | null = null;
	private wasPointing = false;
	private wasFist = false;

	private stateFor(handedness: 'Left' | 'Right'): PerHandState {
		let s = this.handStates.get(handedness);
		if (!s) {
			s = {
				candidateShape: 'none',
				holdFrames: 0,
				confirmedShape: 'none',
				prevPalm: null,
			};
			this.handStates.set(handedness, s);
		}
		return s;
	}

	private confirmShape(
		handedness: 'Left' | 'Right',
		raw: HandShape,
	): HandShape {
		const s = this.stateFor(handedness);
		if (raw === s.candidateShape) {
			s.holdFrames += 1;
		} else {
			s.candidateShape = raw;
			s.holdFrames = 1;
		}
		if (s.holdFrames >= HOLD_FRAMES_TO_CONFIRM) {
			s.confirmedShape = raw;
		}
		return s.confirmedShape;
	}

	process(rawHands: RawHand[], now: number = performance.now(), allowZoom: boolean = false): GestureFrame {
		const handsWithArea = rawHands.map(h => {
			let minX = 1, maxX = 0, minY = 1, maxY = 0;
			for (const p of h.landmarks) {
				if (p.x < minX) minX = p.x;
				if (p.x > maxX) maxX = p.x;
				if (p.y < minY) minY = p.y;
				if (p.y > maxY) maxY = p.y;
			}
			return { ...h, area: (maxX - minX) * (maxY - minY) };
		});
		handsWithArea.sort((a, b) => b.area - a.area);
		const maxHands = allowZoom ? 2 : 1;
		const targetHands = handsWithArea.slice(0, maxHands);

		const readings: HandReading[] = targetHands.map(h => {
			const shape = this.confirmShape(
				h.handedness,
				classifyHandShape(h.landmarks),
			);
			const center = palmCenter(h.landmarks);
			const indexTip = h.landmarks[8];
			return {
				handedness: h.handedness,
				shape,
				landmarks: h.landmarks,
				palmCenter: center,
				indexTip: { x: indexTip.x, y: indexTip.y },
			};
		});

		for (const key of [...this.handStates.keys()]) {
			if (!readings.some(r => r.handedness === key))
				this.handStates.delete(key);
		}

		let action: PresentationAction = { type: 'idle' };
		let label = labelFor('none', false);

		if (allowZoom && readings.length === 2) {
			const [a, b] = readings;
			const d = Math.hypot(
				a.palmCenter.x - b.palmCenter.x,
				a.palmCenter.y - b.palmCenter.y,
			);
			if (this.prevTwoHandDistance !== null) {
				const delta = d - this.prevTwoHandDistance;
				if (Math.abs(delta) > 0.0015) {
					action = {
						type: 'zoom',
						factor: 1 + delta * TWO_HAND_ZOOM_SENSITIVITY,
					};
				}
			}
			this.prevTwoHandDistance = d;
			label = labelFor('none', true);
			for (const s of this.handStates.values()) {
				s.prevPalm = null;
			}
			this.wasFist = false;
		} else {
			this.prevTwoHandDistance = null;

			if (readings.length === 1) {
				const hand = readings[0];
				const s = this.stateFor(hand.handedness);
				label = labelFor(hand.shape, false);

				if (hand.shape !== 'fist') this.wasFist = false;

				switch (hand.shape) {
					case 'open_palm': {
						if (s.prevPalm) {
							const dy = hand.palmCenter.y - s.prevPalm.y;
							const sinceSwipe = now - this.lastSwipeAt;
							if (
								Math.abs(dy) > SWIPE_VELOCITY &&
								sinceSwipe > SWIPE_COOLDOWN_MS
							) {
								action =
									dy < 0 ? { type: 'next-slide' } : { type: 'prev-slide' };
								this.lastSwipeAt = now;
							}
						}
						s.prevPalm = hand.palmCenter;
						break;
					}
					case 'pointing': {
						action = { type: 'point', x: hand.indexTip.x, y: hand.indexTip.y };
						this.wasPointing = true;
						s.prevPalm = null;
						break;
					}
					case 'fist': {
						if (!this.wasFist) {
							action = { type: 'reset' };
							this.wasFist = true;
						}
						s.prevPalm = null;
						break;
					}
					default: {
						s.prevPalm = null;
					}
				}
			}
		}

		if (action.type !== 'point' && this.wasPointing) {
			this.wasPointing = false;
			action = { type: 'point-end' };
		}

		return { hands: readings, action, label };
	}

	reset(): void {
		this.handStates.clear();
		this.lastSwipeAt = 0;
		this.prevTwoHandDistance = null;
		this.wasPointing = false;
		this.wasFist = false;
	}
}
