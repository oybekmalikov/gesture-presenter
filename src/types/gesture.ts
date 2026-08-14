export interface Landmark {
	x: number;
	y: number;
	z: number;
}

export type HandShape = 'open_palm' | 'fist' | 'pointing' | 'pinch' | 'none';

export interface HandReading {
	handedness: 'Left' | 'Right';
	shape: HandShape;
	landmarks: Landmark[];
	palmCenter: { x: number; y: number };
	indexTip: { x: number; y: number };
}

export type PresentationAction =
	| { type: 'next-slide' }
	| { type: 'prev-slide' }
	| { type: 'zoom'; factor: number }
	| { type: 'point'; x: number; y: number }
	| { type: 'point-end' }
	| { type: 'reset' }
	| { type: 'idle' };

export interface GestureFrame {
	hands: HandReading[];
	action: PresentationAction;
	label: string;
}
