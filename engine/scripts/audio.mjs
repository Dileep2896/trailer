// Synthesizes the sound effects and a music bed with ffmpeg at config.music.bpm (90 to 132,
// default 120) in config.music.mood (calm, warm, tense, driving, playful). Scenes cut on the
// same beat grid, so the bed's bars line up with the cuts; the drums come in on the first bar
// line at or after the turn (a scene with "turn": true, else the reveal). The video ducks the
// bed under the voice.
//
// A licensed track can replace the bed: set config.music to its path (relative to the
// config), or config.music.file with its bpm; it is copied in and ducked the same way.
//
// The effects are generated once per engine version into <runtime>/public/sfx (never
// committed); the bed is generated per render into .trailer/.stage/<render>/music/.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS } from '../src/timeline.mjs';
import { resolveMusic } from '../src/options.mjs';
import { ffmpeg } from './runtime.mjs';

const synthSfx = (ff, dir) => {
  mkdirSync(dir, { recursive: true });
  const tone = (name, sec, expr, filters = 'anull') =>
    ff('-f', 'lavfi', '-i', `aevalsrc='${expr}':s=48000:d=${sec}`, '-af', `${filters},aformat=channel_layouts=stereo`, resolve(dir, `${name}.wav`));
  // UI click: a short bright transient.
  tone('click', 0.08, '0.6*sin(2*PI*3100*t)*exp(-t*260)+0.5*(random(0)*2-1)*exp(-t*500)', 'highpass=f=900');
  // Pop for things landing: a quick downward chirp.
  tone('pop', 0.18, '0.5*sin(2*PI*(500*t+700*(1-exp(-t*40))/40))*exp(-t*22)');
  // Tick for counters.
  tone('tick', 0.04, '0.35*sin(2*PI*4200*t)*exp(-t*400)', 'highpass=f=1500');
  // Success chime: E6 and B6 with a little air.
  tone('ding', 1.6, '0.42*sin(2*PI*1318.5*t)*exp(-t*3.2)+0.3*sin(2*PI*1975.5*t)*exp(-t*4.5)+0.12*sin(2*PI*2637*t)*exp(-t*7)', 'aecho=0.8:0.6:90|170:0.25|0.15');
  // Impact for the reveal and the end card: a pitch-dropping sub with a noisy transient.
  tone('impact', 2.2, '0.95*sin(2*PI*(38*t+140*(1-exp(-t*16))/16))*exp(-t*2.6)+0.35*(random(0)*2-1)*exp(-t*28)', 'lowpass=f=5000,aecho=0.8:0.5:120|240:0.3|0.18');
  // Whoosh for cuts: shaped pink noise.
  ff('-f', 'lavfi', '-i', 'anoisesrc=color=pink:d=0.7:a=0.9:r=48000', '-af', "highpass=f=250,lowpass=f=4200,volume='pow(sin(PI*t/0.7),3)':eval=frame,aformat=channel_layouts=stereo", resolve(dir, 'whoosh.wav'));
  // Glitch: bit-crushed noise stutters for glitch cuts.
  tone('glitch', 0.32, '0.5*(random(0)*2-1)*if(lt(mod(t,0.06),0.035),1,0.15)*exp(-t*6)+0.3*sin(2*PI*180*t)*if(lt(mod(t,0.08),0.04),1,0)*exp(-t*8)', 'acrusher=bits=4:samples=12,highpass=f=300');
  // Swish: a page turning.
  ff('-f', 'lavfi', '-i', 'anoisesrc=color=pink:d=0.45:a=0.8:r=48000', '-af', "bandpass=f=3200:w=2600,volume='pow(sin(PI*t/0.45),2)*(1-t/0.5)':eval=frame,aformat=channel_layouts=stereo", resolve(dir, 'swish.wav'));
  // Thunk: a stamp landing.
  tone('thunk', 0.35, '0.9*sin(2*PI*(70*t+60*(1-exp(-t*40))/40))*exp(-t*16)+0.4*(random(0)*2-1)*exp(-t*90)', 'lowpass=f=2500');
  // Key: a typewriter key.
  tone('key', 0.06, '0.5*(random(0)*2-1)*exp(-t*160)+0.3*sin(2*PI*1800*t)*exp(-t*220)', 'bandpass=f=2500:w=3000');
  // Riser into the reveal.
  ff(
    '-f', 'lavfi', '-i', 'anoisesrc=color=white:d=1.5:a=0.5:r=48000',
    '-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(180*t+340*t*t))*pow(t/1.5,2)':s=48000:d=1.5",
    '-filter_complex', "[0]highpass=f=1200,volume='pow(t/1.5,3)':eval=frame[n];[n][1]amix=inputs=2:normalize=0,aformat=channel_layouts=stereo",
    resolve(dir, 'riser.wav'),
  );
  // v3 format palette.
  // Gavel: two hard wooden knocks.
  tone('gavel', 0.6, '0.9*sin(2*PI*210*t)*exp(-t*38)+0.5*(random(0)*2-1)*exp(-t*140)+if(gt(t,0.16),0.7*sin(2*PI*230*(t-0.16))*exp(-(t-0.16)*40)+0.35*(random(0)*2-1)*exp(-(t-0.16)*150),0)', 'lowpass=f=3200,aecho=0.6:0.4:60:0.2');
  // Referee whistle: a trilled pea whistle.
  tone('whistle', 0.7, '0.32*sin(2*PI*(2850*t+18*sin(2*PI*34*t)))*(0.6+0.4*sin(2*PI*34*t))*min(1,t*40)*min(1,(0.7-t)*12)', 'highpass=f=1200');
  // Game-show buzzer.
  tone('buzzer', 0.55, '0.22*(sin(2*PI*140*t)+0.6*sin(2*PI*280*t)+0.4*sin(2*PI*420*t)+0.3*sin(2*PI*563*t))*min(1,t*60)*min(1,(0.55-t)*20)', 'lowpass=f=2400');
  // Tape rewind: a rising warble over hiss.
  tone('rewind', 1.1, '0.28*sin(2*PI*(260*t+700*t*t)+6*sin(2*PI*9*t))*min(1,t*10)*min(1,(1.1-t)*6)+0.12*(random(0)*2-1)', 'bandpass=f=1800:w=2600');
  // Chalk on a board: scratchy bursts.
  tone('chalk', 0.5, '0.35*(random(0)*2-1)*(0.5+0.5*sin(2*PI*23*t))*min(1,t*30)*min(1,(0.5-t)*10)', 'bandpass=f=3800:w=2400,highpass=f=1600');
  // PA chime: two soft tones, high then low.
  tone('chime', 1.4, '0.35*sin(2*PI*1046.5*t)*exp(-t*3)*lt(t,0.45)+if(gte(t,0.38),0.35*sin(2*PI*830.6*(t-0.38))*exp(-(t-0.38)*2.6),0)', 'aecho=0.8:0.5:110:0.2');
  // Glass shatter: a noise crack with bright tinkles.
  tone('shatter', 0.9, '0.6*(random(0)*2-1)*exp(-t*14)+0.2*sin(2*PI*5200*t)*exp(-t*9)+0.15*sin(2*PI*6900*t)*exp(-t*11)+0.12*sin(2*PI*4400*t)*exp(-t*7)', 'highpass=f=900');
  // Boing: a springy character landing.
  tone('boing', 0.5, '0.45*sin(2*PI*(180*t+90*sin(2*PI*11*t)*exp(-t*6)/(2*PI*11)*20))*exp(-t*6)', 'lowpass=f=2400');
  // HUD beep.
  tone('beep', 0.12, '0.3*sin(2*PI*1760*t)*min(1,t*200)*min(1,(0.12-t)*60)');
};

/** Generate the sound effects into <runtime>/public/sfx unless this version already did. */
export const ensureSfx = (runtimeDir) => {
  const dir = resolve(runtimeDir, 'public', 'sfx');
  const stamp = resolve(dir, '.stamp');
  const want = createHash('sha1').update(readFileSync(fileURLToPath(import.meta.url))).digest('hex').slice(0, 12);
  if (existsSync(stamp) && readFileSync(stamp, 'utf8') === want) return dir;
  synthSfx((...args) => ffmpeg(runtimeDir, args), dir);
  writeFileSync(stamp, want);
  return dir;
};

// Chords per mood: four chords (two bars each), four pad voices plus a bass root (Hz).
const MOOD_BEDS = {
  // Soft major sevenths, no drums: only a shaker on the off-beats.
  calm: { chords: [[261.63, 329.63, 392, 493.88, 65.41], [220, 261.63, 329.63, 392, 55], [174.61, 220, 261.63, 329.63, 43.65], [196, 246.94, 293.66, 369.99, 49]], kick: 'none', hats: 'shaker', pump: false, arp: false, pad: 0.13, lp: 1500 },
  // F, C, Dm, Bb with a half-time kick.
  warm: { chords: [[174.61, 220, 261.63, 349.23, 43.65], [196, 261.63, 329.63, 392, 65.41], [220, 293.66, 349.23, 440, 73.42], [233.08, 293.66, 349.23, 466.16, 58.27]], kick: 'half', hats: 'off', pump: false, arp: false, pad: 0.07, lp: 1800 },
  // Am, Bb, Am, E: a semitone rub, a pulsing low drone, sixteenth ticks.
  tense: { chords: [[220, 261.63, 329.63, 440, 55], [233.08, 293.66, 349.23, 466.16, 58.27], [220, 261.63, 329.63, 415.3, 55], [207.65, 246.94, 329.63, 415.3, 41.2]], kick: 'one', hats: 'ticks', pump: true, arp: false, pad: 0.06, lp: 1300 },
  // Am, F, C, G, four on the floor, pumping pads (the v1 bed).
  driving: { chords: [[220, 261.63, 329.63, 392, 55], [174.61, 220, 261.63, 329.63, 43.65], [261.63, 329.63, 392, 493.88, 65.41], [196, 246.94, 293.66, 392, 49]], kick: 'four', hats: 'off', pump: true, arp: false, pad: 0.07, lp: 1900 },
  // C, G, Am, F with a plucked eighth-note arpeggio and a bouncy half-time kick.
  playful: { chords: [[261.63, 329.63, 392, 523.25, 65.41], [196, 246.94, 293.66, 392, 49], [220, 261.63, 329.63, 440, 55], [174.61, 220, 261.63, 349.23, 43.65]], kick: 'half', hats: 'off', pump: false, arp: true, pad: 0.05, lp: 2600 },
};

/** A synthesized bed at `bpm` in `mood`; the drums come in from `drop` (the reveal). */
const bed = (ff, file, D, drop, bpm, mood) => {
  const M = MOOD_BEDS[mood] ?? MOOD_BEDS.driving;
  const B = 60 / bpm;
  const c = `mod(floor(t/${8 * B}),4)`;
  const pick = (vals, sel = c) => `if(eq(${sel},0),${vals[0]},if(eq(${sel},1),${vals[1]},if(eq(${sel},2),${vals[2]},${vals[3]})))`;
  const voice = (k) => pick(M.chords.map((ch) => ch[k]));
  const breathe = `pow(sin(PI*mod(t,${4 * B})/${4 * B}),0.6)`;
  const u = `mod(t,${B})`;
  const pump = M.pump ? `if(gte(t,${drop}),0.45+0.55*(1-exp(-${u}*7)),1)` : '1';
  const pad = [0, 1, 2, 3].map((k) => `sin(2*PI*${voice(k)}*t)+0.6*sin(2*PI*${voice(k)}*1.004*t)`).join('+');
  const root = voice(4);
  const period = { four: B, half: 2 * B, one: 4 * B }[M.kick];
  const ku = period ? `mod(t,${period})` : null;
  const kick = ku ? `if(gte(t,${drop}),0.9*sin(2*PI*(46*${ku}+110*(1-exp(-${ku}*30))/30))*exp(-${ku}*11),0)` : '0';
  const sub = M.kick === 'none' ? `0.12*sin(2*PI*${root}*t)` : `if(gte(t,${drop}),0.33*sin(2*PI*${root}*t)*(1-exp(-${u}*9)),0.1*sin(2*PI*${root}*t))`;
  const arp = M.arp
    ? `if(gte(t,${drop}),0.16*sin(2*PI*2*${pick([0, 1, 2, 3].map((k) => voice(k)), `mod(floor(t/${B / 2}),4)`)}*t)*exp(-mod(t,${B / 2})*13),0)`
    : '0';
  const hats = {
    off: `if(gte(t,${drop + 2 * B}),exp(-mod(t-${B / 2},${B})*70),if(lt(t,${drop}),0.35*exp(-mod(t,${B / 4})*90),0))`,
    shaker: `0.5*exp(-mod(t-${B / 2},${B})*40)`,
    ticks: `0.45*exp(-mod(t,${B / 4})*110)`,
  }[M.hats];
  const fade = `if(lt(t,${D - 1.5}),1,max(0,(${D}-t)/1.5))`;
  ff(
    '-f', 'lavfi', '-i', `aevalsrc='${M.pad}*(${pad})*${breathe}*${pump}+${arp}':s=48000:d=${D}`,
    '-f', 'lavfi', '-i', `aevalsrc='(${kick}+${sub})*${fade}':s=48000:d=${D}`,
    '-f', 'lavfi', '-i', `anoisesrc=color=white:d=${D}:a=0.5:r=48000`,
    '-f', 'lavfi', '-i', `aevalsrc='${hats}*${fade}':s=48000:d=${D}`,
    '-filter_complex',
    [`[0]lowpass=f=${M.lp},aecho=0.8:0.7:${Math.round(B * 600)}|${Math.round(B * 1020)}:0.3|0.2[pad]`, '[1]lowpass=f=6000[low]', '[2]highpass=f=7500[noise]', '[noise][3]amultiply,volume=0.18[hat]', '[pad][low][hat]amix=inputs=3:normalize=0,alimiter=limit=0.8,aformat=channel_layouts=stereo'].join(';'),
    file,
  );
};

/**
 * The music for one render: a copied track or a synthesized bed in <publicDir>/music/.
 * Returns the public path (music/...) or null for config.music === false.
 */
export const music = (p, { dir, tl, publicDir, log = (m) => console.error(m) }) => {
  if (p.config.music === false) return null;
  const out = resolve(publicDir, 'music');
  mkdirSync(out, { recursive: true });
  const mu = resolveMusic(p.config);
  if (mu.file) {
    const src = resolve(p.configDir, mu.file);
    if (!existsSync(src)) throw new Error(`music file ${mu.file} not found (relative to the config)`);
    const name = `track${extname(src)}`;
    copyFileSync(src, resolve(out, name));
    log(`music: ${mu.file}`);
    return `music/${name}`;
  }
  const turnIdx = p.config.scenes.findIndex((s) => s.turn === true);
  const turn = turnIdx >= 0 ? tl.scenes[turnIdx] : tl.scenes.find((s) => s.type === 'reveal' || s.type === 'title');
  const bar = (4 * 60) / mu.bpm;
  const drop = turn ? Math.ceil(turn.from / FPS / bar - 1e-6) * bar : bar * 2;
  const D = Math.ceil(tl.total / FPS) + 1;
  const name = `bed-${createHash('sha1').update(`${D}|${drop}|${mu.bpm}|${mu.mood}`).digest('hex').slice(0, 10)}.wav`;
  const file = resolve(out, name);
  if (!existsSync(file)) bed((...args) => ffmpeg(dir, args), file, D, drop, mu.bpm, mu.mood);
  log(`music: bed ${D} s at ${mu.bpm} BPM (${mu.mood}), drums from ${drop.toFixed(2)} s`);
  return `music/${name}`;
};
