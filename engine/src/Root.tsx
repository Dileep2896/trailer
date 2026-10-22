import { Composition, getInputProps } from 'remotion';
import { Trailer } from './Trailer';
import { FPS, buildTimeline } from './timeline.mjs';
import { normalizeConfig } from './config.mjs';
import { FRAMES, type Aspect } from './frame';
import type { TrailerProps } from './types';

// One composition, driven by input props (the engine writes .trailer/.stage/<render>/props.json).
// Its size comes from the config's aspect and its length from the measured voice, so both are
// computed per render.

const EMPTY: TrailerProps = {
  config: {
    projectName: 'Trailer',
    tagline: 'Pass --props=.trailer/.stage/<render>/props.json',
    theme: { accent: '#3b82f6' },
    scenes: [{ type: 'title', title: 'Pass --props', sub: '.trailer/.stage/<render>/props.json' } as any],
    lines: [],
  },
  shots: {},
  media: { lines: [] },
  music: null,
};

const sizeOf = (p: TrailerProps) => {
  const c = normalizeConfig(p.config);
  return FRAMES[(c.aspect ?? '16:9') as Aspect] ?? FRAMES['16:9'];
};

export const Root: React.FC = () => {
  const input = getInputProps() as Partial<TrailerProps>;
  const defaults = input.config ? (input as TrailerProps) : EMPTY;
  const { W, H } = sizeOf(defaults);
  return (
    <Composition
      id="Trailer"
      component={Trailer}
      fps={FPS}
      width={W}
      height={H}
      durationInFrames={buildTimeline(defaults.config, defaults.media).total}
      defaultProps={defaults}
      calculateMetadata={({ props }) => {
        const s = sizeOf(props);
        return { durationInFrames: buildTimeline(props.config, props.media).total, width: s.W, height: s.H };
      }}
    />
  );
};
