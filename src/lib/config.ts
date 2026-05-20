import type { Banner } from './types';

export const SEGMENTS = {
  batch1: 'faaf90c0-5f9e-4f5f-960a-e61e581e933a',
  batch2: '77a85b5d-3dfa-4281-b238-ad9fde7cce21',
  batch3: '480861a1-41b0-46de-997b-1d38bd4d767d',
} as const;

export const SEGMENT_SIZES = {
  batch1: '~35K',
  batch2: '~34K',
  batch3: '~28K',
} as const;

export const SENDER_ID = 8169781;
export const SUPPRESSION_GROUP = 35234;
export const IMAGE_CDN = 'https://cdn.thingiverse.com';
export const THINGIVERSE_URL = 'https://www.thingiverse.com';

export const METABASE_URL = 'https://metabase.myminifactory.com';
export const METABASE_DB = 28;

export const DEFAULT_SEND_HOUR_UTC = 17; // 5pm UTC

export const STAT_THRESHOLDS = {
  deliveryMin: 0.95,
  opensMin: 0.15,
  bouncesMax: 0.02,
  spamMax: 0.0005,
  unsubsMax: 0.003,
} as const;

export const BANNERS: Banner[] = [
  {
    name: 'Capture Challenge',
    imageUrl: 'https://tg-content.vercel.app/assets/banner-capture-challenge.webp',
    linkUrl: 'https://www.thingiverse.com/challenges/capturechallenge',
    description: 'Design accessories and tools that support the art of image-making. Cash prizes up for grabs.',
    active: true,
  },
  {
    name: 'Forum',
    imageUrl: 'https://tg-content.vercel.app/assets/banner-forum-live.png',
    linkUrl: 'https://forum.thingiverse.com',
    description: 'The all-new Thingiverse Forum is live. Share your thoughts and help shape the future of the platform.',
    active: true,
  },
  {
    name: 'Pico Builders',
    imageUrl: 'https://tg-content.vercel.app/assets/banner-pico-builders.png',
    linkUrl: 'https://challenges.thingiverse.com/pico-builders',
    description: 'Thingiverse x Raspberry Pi. One tiny chip, infinite printable builds. Enter now.',
    active: true,
  },
];
