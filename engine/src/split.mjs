// Split-screen geometry for 16:9: where each half's panel sits. Pure, so it is unit-tested
// (test/split.test.mjs) and shared by the `split` scene.
//
// A panel pads its content 60 px in from its rect (Panel in v3/scenes/stage.tsx). The rects
// start at the frame's title-safe insets, so a label, title or window in either half never
// lands in the outer 96 px of a 16:9 frame. The backgrounds (`bg`) still bleed edge to edge.

/**
 * @param {{ W: number, H: number, safe: { left: number, right: number } }} fr the frame
 * @param {number} top content top (px)
 * @param {number} bottom content bottom (px)
 */
export const splitPanelsWide = (fr, top, bottom) => {
  const half = fr.W / 2;
  const h = bottom - top;
  return {
    left: { r: { x: fr.safe.left, y: top, w: half - fr.safe.left, h }, bg: { x: 0, y: 0, w: half, h: fr.H } },
    right: { r: { x: half, y: top, w: half - fr.safe.right, h }, bg: { x: half, y: 0, w: half, h: fr.H } },
  };
};
