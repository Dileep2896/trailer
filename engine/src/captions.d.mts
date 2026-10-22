import type { Timeline } from './types';
export type CaptionWord = { text: string; from: number; to: number };
export type CaptionChunk = { line: number; from: number; to: number; text: string; words: CaptionWord[] };
export function captionChunks(tl: Timeline, opts?: { maxWords?: number; maxChars?: number }): CaptionChunk[];
export function toSrt(chunks: CaptionChunk[]): string;
export function toVtt(chunks: CaptionChunk[]): string;
