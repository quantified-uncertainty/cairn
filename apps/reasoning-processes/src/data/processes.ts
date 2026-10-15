// The two-axes map of reasoning processes: cost per validated bit (x) vs.
// cost to corrupt (y). Coordinates are first-pass qualitative judgments (v0)
// derived from the ratings in the Process Catalogue, on a 0-100 scale.
// Shared by ProcessMap.astro and HomeMap.astro so the two maps cannot drift.
// label dx/dy/anchor place each label in ProcessMap by hand to avoid collisions.

export type Family = 'resolution' | 'institutional' | 'ai';

export interface ProcessPoint {
	name: string;
	x: number; // info cost: 0 = cheap, 100 = expensive
	y: number; // corruption cost: 0 = cheap to corrupt, 100 = expensive
	family: Family;
	dx: number;
	dy: number;
	anchor: 'start' | 'middle' | 'end';
}

export const points: ProcessPoint[] = [
	{ name: 'Formal proof', x: 80, y: 92, family: 'resolution', dx: 0, dy: -10, anchor: 'middle' },
	{ name: 'Full replication', x: 90, y: 84, family: 'resolution', dx: 0, dy: 18, anchor: 'end' },
	{ name: 'Forecaster track records', x: 48, y: 80, family: 'resolution', dx: -10, dy: 4, anchor: 'end' },
	{ name: 'Real-money market (Kalshi-style)', x: 54, y: 67, family: 'resolution', dx: -10, dy: 4, anchor: 'end' },
	{ name: 'Output-metered market', x: 62, y: 73, family: 'resolution', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Tournament (Metaculus-style)', x: 50, y: 56, family: 'resolution', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Play-money market', x: 30, y: 28, family: 'resolution', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Courts', x: 84, y: 64, family: 'institutional', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Expert panel', x: 44, y: 46, family: 'institutional', dx: -10, dy: 4, anchor: 'end' },
	{ name: 'Financial audit', x: 46, y: 30, family: 'institutional', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Peer review', x: 52, y: 22, family: 'institutional', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Composite indices', x: 10, y: 7, family: 'institutional', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Online reviews', x: 19, y: 13, family: 'institutional', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Debate protocol', x: 58, y: 50, family: 'ai', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Consistency battery', x: 13, y: 33, family: 'ai', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Multi-model LLM panel', x: 9, y: 24, family: 'ai', dx: 10, dy: 4, anchor: 'start' },
	{ name: 'Single LLM judge', x: 6, y: 14, family: 'ai', dx: 10, dy: 4, anchor: 'start' },
];
