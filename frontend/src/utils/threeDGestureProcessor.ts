import type { RawHand } from '../hooks/useHandTracking';
import type { HandShape } from '../types/gesture';
import { classifyHandShape, palmCenter } from './handShape';

export type ThreeDGestureAction =
	| { type: 'rotate'; x: number; y: number }
	| { type: 'zoom'; delta: number }
	| { type: 'toggle-explode' }
	| { type: 'point'; x: number; y: number }
	| { type: 'idle' };

export interface ThreeDGestureFrame {
	action: ThreeDGestureAction;
	label: string;
	confirmedShapes: Map<'Left' | 'Right', HandShape>;
}

interface TrackedHand {
	candidate: HandShape;
	candidateFrames: number;
	confirmed: HandShape;
	prevPalm: { x: number; y: number } | null;
}

const CONFIRM_FRAMES = 3;
const ZOOM_DEAD_ZONE = 0.001;

export class ThreeDGestureProcessor {
	private states = new Map<'Left' | 'Right', TrackedHand>();
	private previousTwoHandDistance: number | null = null;
	private resetHeld = false;

	private stateFor(handedness: 'Left' | 'Right') {
		let state = this.states.get(handedness);
		if (!state) {
			state = {
				candidate: 'none',
				candidateFrames: 0,
				confirmed: 'none',
				prevPalm: null,
			};
			this.states.set(handedness, state);
		}
		return state;
	}

	process(rawHands: RawHand[]): ThreeDGestureFrame {
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

		const hands = handsWithArea.slice(0, 2);

		const visible = new Set(hands.map(hand => hand.handedness));
		for (const handedness of this.states.keys()) {
			if (!visible.has(handedness)) this.states.delete(handedness);
		}

		for (const hand of hands) {
			const state = this.stateFor(hand.handedness);
			const rawShape = classifyHandShape(hand.landmarks);
			if (rawShape === state.candidate) {
				state.candidateFrames += 1;
			} else {
				state.candidate = rawShape;
				state.candidateFrames = 1;
			}
			if (state.candidateFrames >= CONFIRM_FRAMES) {
				state.confirmed = rawShape;
			}
		}

		const confirmedShapes = new Map(
			hands.map(hand => [hand.handedness, this.stateFor(hand.handedness).confirmed]),
		);

		if (hands.length >= 2) {
			const a = hands[0];
			const b = hands[1];
			for (const state of this.states.values()) state.prevPalm = null;
			this.resetHeld = false;

			const centerA = palmCenter(a.landmarks);
			const centerB = palmCenter(b.landmarks);
			const distance = Math.hypot(centerA.x - centerB.x, centerA.y - centerB.y);

			let action: ThreeDGestureAction = { type: 'idle' };
			if (this.previousTwoHandDistance !== null) {
				const delta = distance - this.previousTwoHandDistance;
				if (Math.abs(delta) >= ZOOM_DEAD_ZONE) {
					action = { type: 'zoom', delta };
				}
			}
			this.previousTwoHandDistance = distance;
			return { action, label: "🤲 Ikki qo'l — masshtab", confirmedShapes };
		}

		this.previousTwoHandDistance = null;
		if (hands.length !== 1) {
			this.resetHeld = false;
			return { action: { type: 'idle' }, label: "🖐️ Qo'lni ko'rsating", confirmedShapes };
		}

		const state = this.stateFor(hands[0].handedness);
		const center = palmCenter(hands[0].landmarks);

		if (state.confirmed === 'pinch') {
			const thumb = hands[0].landmarks[4];
			const index = hands[0].landmarks[8];
			const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
			let action: ThreeDGestureAction = { type: 'idle' };
			if (state.prevPalm) {
				const delta = (pinchDist - state.prevPalm.x) * 4;
				if (Math.abs(delta) >= 0.005) {
					action = { type: 'zoom', delta };
				}
			}
			state.prevPalm = { x: pinchDist, y: 0 };
			this.resetHeld = false;
			return { action, label: '🤏 Chimchilash — masshtab', confirmedShapes };
		}

		if (state.confirmed === 'open_palm') {
			let action: ThreeDGestureAction = { type: 'idle' };
			if (state.prevPalm) {
				const x = center.x - state.prevPalm.x;
				const y = center.y - state.prevPalm.y;
				action = { type: 'rotate', x, y };
			}
			state.prevPalm = center;
			this.resetHeld = false;
			return { action, label: '✋ Ochiq kaft — aylantirish', confirmedShapes };
		}

		state.prevPalm = null;
		if (state.confirmed === 'fist') {
			const action: ThreeDGestureAction = this.resetHeld ? { type: 'idle' } : { type: 'toggle-explode' };
			this.resetHeld = true;
			return { action, label: "✊ Musht — sochish / yig'ish", confirmedShapes };
		}

		if (state.confirmed === 'pointing') {
			state.prevPalm = null;
			this.resetHeld = false;
			const tip = hands[0].landmarks[8];
			return {
				action: { type: 'point', x: tip.x, y: tip.y },
				label: "☝️ Ko'rsatkich — detalni tanlash",
				confirmedShapes,
			};
		}

		this.resetHeld = false;
		return { action: { type: 'idle' }, label: 'Gesturani barqaror ushlab turing…', confirmedShapes };
	}

	reset() {
		this.states.clear();
		this.previousTwoHandDistance = null;
		this.resetHeld = false;
	}
}
