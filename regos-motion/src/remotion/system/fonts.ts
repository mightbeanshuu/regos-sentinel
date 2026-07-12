import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadIBMPlexSans} from '@remotion/google-fonts/IBMPlexSans';
import {loadFont as loadIBMPlexSerif} from '@remotion/google-fonts/IBMPlexSerif';

const sora = loadSora('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const ibmSans = loadIBMPlexSans('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const ibmSerif = loadIBMPlexSerif('normal', {
  weights: ['400', '500', '600'],
  subsets: ['latin'],
});

export const FONT_SORA = sora.fontFamily;
export const FONT_IBM_SANS = ibmSans.fontFamily;
export const FONT_IBM_SERIF = ibmSerif.fontFamily;
