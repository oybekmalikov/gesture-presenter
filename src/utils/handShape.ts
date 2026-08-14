import type { HandShape, Landmark } from '../types/gesture';

const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;
const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;
const RING_MCP = 13;
const RING_PIP = 14;
const RING_TIP = 16;
const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

function dist(a: Landmark, b: Landmark): number {
	return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function handScale(lm: Landmark[]): number {
	return Math.max(dist(lm[WRIST], lm[MIDDLE_MCP]), 0.05);
}

function isExtended(
	lm: Landmark[],
	tip: number,
	pip: number,
	mcp: number,
): boolean {
	const scale = handScale(lm);
	const tipToMcp = dist(lm[tip], lm[mcp]);
	const pipToMcp = dist(lm[pip], lm[mcp]);
	return tipToMcp > pipToMcp * 1.15 && tipToMcp > scale * 0.75;
}

export function palmCenter(lm: Landmark[]): { x: number; y: number } {
	const pts = [
		lm[WRIST],
		lm[INDEX_MCP],
		lm[MIDDLE_MCP],
		lm[RING_MCP],
		lm[PINKY_MCP],
	];
	const x = pts.reduce((s, p) => s + p.x, 0) / pts.length;
	const y = pts.reduce((s, p) => s + p.y, 0) / pts.length;
	return { x, y };
}

export function pinchDistance(lm: Landmark[]): number {
	return dist(lm[THUMB_TIP], lm[INDEX_TIP]);
}

export function classifyHandShape(lm: Landmark[]): HandShape {
	if (lm.length < 21) return 'none';

	const scale = handScale(lm);
	const indexExt = isExtended(lm, INDEX_TIP, INDEX_PIP, INDEX_MCP);
	const middleExt = isExtended(lm, MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP);
	const ringExt = isExtended(lm, RING_TIP, RING_PIP, RING_MCP);
	const pinkyExt = isExtended(lm, PINKY_TIP, PINKY_PIP, PINKY_MCP);
	const extendedCount = [indexExt, middleExt, ringExt, pinkyExt].filter(
		Boolean,
	).length;

	const pinch = pinchDistance(lm);
	const thumbNearPalm = dist(lm[THUMB_TIP], lm[INDEX_MCP]) < scale * 0.9;

	if (pinch < scale * 0.55 && !middleExt && !ringExt && !pinkyExt) {
		return 'pinch';
	}

	if (indexExt && !middleExt && !ringExt && !pinkyExt) {
		return 'pointing';
	}

	if (extendedCount === 0 && thumbNearPalm) {
		return 'fist';
	}

	if (extendedCount >= 3) {
		return 'open_palm';
	}

	return 'none';
}
