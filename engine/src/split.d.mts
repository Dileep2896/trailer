export type SplitRect = { x: number; y: number; w: number; h: number };
export function splitPanelsWide(
  fr: { W: number; H: number; safe: { left: number; right: number } },
  top: number,
  bottom: number,
): { left: { r: SplitRect; bg: SplitRect }; right: { r: SplitRect; bg: SplitRect } };
