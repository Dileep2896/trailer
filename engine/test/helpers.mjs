// Small config builders shared by the tests.
export const base = (over = {}) => ({
  version: 1,
  projectName: 'Testbed',
  theme: { accent: '#3366ff' },
  music: { bpm: 120 },
  scenes: [
    { id: 'hook', type: 'kinetic', beats: [{ text: 'Hello there.' }], say: 'Testbed checks every file.' },
    { id: 'end', type: 'outro', say: 'Testbed. Try it today.' },
  ],
  ...over,
});

/** A media object with fixed line lengths in seconds. */
export const media = (...seconds) => ({ lines: seconds.map((s) => ({ src: null, seconds: s, words: null })) });
