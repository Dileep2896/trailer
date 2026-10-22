// Generated from FONT_NAMES in options.mjs: every Google font a config can name.
// Each loads only when a config uses it, with the weights it actually has.
import * as FInter from '@remotion/google-fonts/Inter';
import * as FInterTight from '@remotion/google-fonts/InterTight';
import * as FGeist from '@remotion/google-fonts/Geist';
import * as FSora from '@remotion/google-fonts/Sora';
import * as FSpaceGrotesk from '@remotion/google-fonts/SpaceGrotesk';
import * as FManrope from '@remotion/google-fonts/Manrope';
import * as FDMSans from '@remotion/google-fonts/DMSans';
import * as FPlusJakartaSans from '@remotion/google-fonts/PlusJakartaSans';
import * as FOutfit from '@remotion/google-fonts/Outfit';
import * as FArchivo from '@remotion/google-fonts/Archivo';
import * as FArchivoBlack from '@remotion/google-fonts/ArchivoBlack';
import * as FSyne from '@remotion/google-fonts/Syne';
import * as FUnbounded from '@remotion/google-fonts/Unbounded';
import * as FBricolageGrotesque from '@remotion/google-fonts/BricolageGrotesque';
import * as FSchibstedGrotesk from '@remotion/google-fonts/SchibstedGrotesk';
import * as FHankenGrotesk from '@remotion/google-fonts/HankenGrotesk';
import * as FFamiljenGrotesk from '@remotion/google-fonts/FamiljenGrotesk';
import * as FWorkSans from '@remotion/google-fonts/WorkSans';
import * as FIBMPlexSans from '@remotion/google-fonts/IBMPlexSans';
import * as FLexend from '@remotion/google-fonts/Lexend';
import * as FFigtree from '@remotion/google-fonts/Figtree';
import * as FOnest from '@remotion/google-fonts/Onest';
import * as FChivo from '@remotion/google-fonts/Chivo';
import * as FEpilogue from '@remotion/google-fonts/Epilogue';
import * as FInstrumentSans from '@remotion/google-fonts/InstrumentSans';
import * as FPublicSans from '@remotion/google-fonts/PublicSans';
import * as FFraunces from '@remotion/google-fonts/Fraunces';
import * as FInstrumentSerif from '@remotion/google-fonts/InstrumentSerif';
import * as FPlayfairDisplay from '@remotion/google-fonts/PlayfairDisplay';
import * as FDMSerifDisplay from '@remotion/google-fonts/DMSerifDisplay';
import * as FNewsreader from '@remotion/google-fonts/Newsreader';
import * as FSourceSerif4 from '@remotion/google-fonts/SourceSerif4';
import * as FLibreBaskerville from '@remotion/google-fonts/LibreBaskerville';
import * as FCormorantGaramond from '@remotion/google-fonts/CormorantGaramond';
import * as FEBGaramond from '@remotion/google-fonts/EBGaramond';
import * as FIBMPlexSerif from '@remotion/google-fonts/IBMPlexSerif';
import * as FLiterata from '@remotion/google-fonts/Literata';
import * as FLora from '@remotion/google-fonts/Lora';
import * as FGloock from '@remotion/google-fonts/Gloock';
import * as FYoungSerif from '@remotion/google-fonts/YoungSerif';
import * as FRobotoSlab from '@remotion/google-fonts/RobotoSlab';
import * as FZillaSlab from '@remotion/google-fonts/ZillaSlab';
import * as FBitter from '@remotion/google-fonts/Bitter';
import * as FBebasNeue from '@remotion/google-fonts/BebasNeue';
import * as FAnton from '@remotion/google-fonts/Anton';
import * as FOswald from '@remotion/google-fonts/Oswald';
import * as FBarlowCondensed from '@remotion/google-fonts/BarlowCondensed';
import * as FArchivoNarrow from '@remotion/google-fonts/ArchivoNarrow';
import * as FRobotoCondensed from '@remotion/google-fonts/RobotoCondensed';
import * as FSairaCondensed from '@remotion/google-fonts/SairaCondensed';
import * as FTeko from '@remotion/google-fonts/Teko';
import * as FJetBrainsMono from '@remotion/google-fonts/JetBrainsMono';
import * as FIBMPlexMono from '@remotion/google-fonts/IBMPlexMono';
import * as FSpaceMono from '@remotion/google-fonts/SpaceMono';
import * as FDMMono from '@remotion/google-fonts/DMMono';
import * as FFiraCode from '@remotion/google-fonts/FiraCode';
import * as FGeistMono from '@remotion/google-fonts/GeistMono';
import * as FShareTechMono from '@remotion/google-fonts/ShareTechMono';
import * as FVT323 from '@remotion/google-fonts/VT323';
import * as FNunito from '@remotion/google-fonts/Nunito';
import * as FQuicksand from '@remotion/google-fonts/Quicksand';
import * as FFredoka from '@remotion/google-fonts/Fredoka';
import * as FRubik from '@remotion/google-fonts/Rubik';
import * as FVarelaRound from '@remotion/google-fonts/VarelaRound';
import * as FMPLUSRounded1c from '@remotion/google-fonts/MPLUSRounded1c';
import * as FBaloo2 from '@remotion/google-fonts/Baloo2';
import * as FCaveat from '@remotion/google-fonts/Caveat';
import * as FPermanentMarker from '@remotion/google-fonts/PermanentMarker';
import * as FKalam from '@remotion/google-fonts/Kalam';
import * as FArchitectsDaughter from '@remotion/google-fonts/ArchitectsDaughter';

type FontModule = { getInfo: () => { fontFamily: string; fonts: Record<string, Record<string, unknown>> }; loadFont: (style?: string, options?: { weights?: string[]; subsets?: string[] }) => { fontFamily: string } };

export const FONT_MODULES: Record<string, FontModule> = {
  'Inter': FInter,
  'Inter Tight': FInterTight,
  'Geist': FGeist,
  'Sora': FSora,
  'Space Grotesk': FSpaceGrotesk,
  'Manrope': FManrope,
  'DM Sans': FDMSans,
  'Plus Jakarta Sans': FPlusJakartaSans,
  'Outfit': FOutfit,
  'Archivo': FArchivo,
  'Archivo Black': FArchivoBlack,
  'Syne': FSyne,
  'Unbounded': FUnbounded,
  'Bricolage Grotesque': FBricolageGrotesque,
  'Schibsted Grotesk': FSchibstedGrotesk,
  'Hanken Grotesk': FHankenGrotesk,
  'Familjen Grotesk': FFamiljenGrotesk,
  'Work Sans': FWorkSans,
  'IBM Plex Sans': FIBMPlexSans,
  'Lexend': FLexend,
  'Figtree': FFigtree,
  'Onest': FOnest,
  'Chivo': FChivo,
  'Epilogue': FEpilogue,
  'Instrument Sans': FInstrumentSans,
  'Public Sans': FPublicSans,
  'Fraunces': FFraunces,
  'Instrument Serif': FInstrumentSerif,
  'Playfair Display': FPlayfairDisplay,
  'DM Serif Display': FDMSerifDisplay,
  'Newsreader': FNewsreader,
  'Source Serif 4': FSourceSerif4,
  'Libre Baskerville': FLibreBaskerville,
  'Cormorant Garamond': FCormorantGaramond,
  'EB Garamond': FEBGaramond,
  'IBM Plex Serif': FIBMPlexSerif,
  'Literata': FLiterata,
  'Lora': FLora,
  'Gloock': FGloock,
  'Young Serif': FYoungSerif,
  'Roboto Slab': FRobotoSlab,
  'Zilla Slab': FZillaSlab,
  'Bitter': FBitter,
  'Bebas Neue': FBebasNeue,
  'Anton': FAnton,
  'Oswald': FOswald,
  'Barlow Condensed': FBarlowCondensed,
  'Archivo Narrow': FArchivoNarrow,
  'Roboto Condensed': FRobotoCondensed,
  'Saira Condensed': FSairaCondensed,
  'Teko': FTeko,
  'JetBrains Mono': FJetBrainsMono,
  'IBM Plex Mono': FIBMPlexMono,
  'Space Mono': FSpaceMono,
  'DM Mono': FDMMono,
  'Fira Code': FFiraCode,
  'Geist Mono': FGeistMono,
  'Share Tech Mono': FShareTechMono,
  'VT323': FVT323,
  'Nunito': FNunito,
  'Quicksand': FQuicksand,
  'Fredoka': FFredoka,
  'Rubik': FRubik,
  'Varela Round': FVarelaRound,
  'M PLUS Rounded 1c': FMPLUSRounded1c,
  'Baloo 2': FBaloo2,
  'Caveat': FCaveat,
  'Permanent Marker': FPermanentMarker,
  'Kalam': FKalam,
  'Architects Daughter': FArchitectsDaughter,
} as unknown as Record<string, FontModule>;

const loaded: Record<string, string> = {};

/** Load a font by name with the weights it has in [min, max]; returns its CSS family. */
export const loadNamed = (name: string, fallback = "Inter", min = 400, max = 900): string => {
  const n = FONT_MODULES[name] ? name : fallback;
  if (loaded[n]) return loaded[n]!;
  const mod = FONT_MODULES[n]!;
  const have = Object.keys(mod.getInfo().fonts.normal ?? {});
  let weights = have.filter((w) => Number(w) >= min && Number(w) <= max);
  if (!weights.length) weights = have;
  loaded[n] = mod.loadFont("normal", { weights, subsets: ["latin"] }).fontFamily;
  return loaded[n]!;
};
