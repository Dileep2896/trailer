import type { TrailerConfig } from './types';
export const V3_TYPES: string[];
export const ASPECTS: ('16:9' | '9:16' | '1:1')[];
export function aspectSlug(a: string): string;
export function sceneKey(s: { id?: string; type: string }): string;
export function isV3(c: unknown): boolean;
export function deepMerge<A, B>(a: A, b: B): A & B;
export function applyCut<T extends TrailerConfig>(c: T, name: string): T;
export function normalizeConfig<T extends TrailerConfig>(c: T, opts?: { aspect?: string; cut?: string | null }): T & { kit: number; _normalized: true };
