import type { TimelineScene } from './types';
export type Cue = number | string | { line?: number; word?: string; nth?: number; s?: number; offset?: number; edge?: 'start' | 'end' } | undefined | null;
export function cueFrame(t: TimelineScene, cue: Cue, fallback?: number): number;
export function lineEndFrame(t: TimelineScene, i: number, fallback?: number): number;
export function spreadCues(t: TimelineScene, n: number, start?: number): number[];
