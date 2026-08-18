import { useEffect, useRef, useState } from 'react';
import type { RawHand } from './useHandTracking';
import type { GestureFrame } from '../types/gesture';
import { GestureProcessor } from '../utils/gestureProcessor';

const EMPTY_FRAME: GestureFrame = {
	hands: [],
	action: { type: 'idle' },
	label: "🖐️ Qo'lni ko'rsating",
};

export function usePresentationGestures(
	hands: RawHand[],
	active: boolean,
): GestureFrame {
	const processorRef = useRef<GestureProcessor>(new GestureProcessor());
	const [frame, setFrame] = useState<GestureFrame>(EMPTY_FRAME);

	useEffect(() => {
		if (!active) {
			processorRef.current.reset();
			setFrame(EMPTY_FRAME);
			return;
		}
		setFrame(processorRef.current.process(hands));
	}, [hands, active]);

	return frame;
}
