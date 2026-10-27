import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import type { ImageMetadata } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import type { Lang } from '../i18n/utils';

export const socialCardSize = { width: 1200, height: 630 };

/** Share image of a page: 'index', 'proyectos' or a design work id. Served by src/pages/og/[lang]/[card].jpg.ts */
export const socialCardPath = (lang: Lang, card: string) => `/og/${lang}/${card}.jpg`;

export type SocialCard = {
  eyebrow?: string;
  title: string;
  /** Under the title: the first one in the accent color, the second one muted */
  lines: [string, string?];
  visual: { kind: 'photo' | 'cover'; image: ImageMetadata } | { kind: 'collage'; images: ImageMetadata[] };
};

type Child = Element | string | false | undefined;
interface Element {
  type: string;
  props: Record<string, unknown>;
}

const h = (type: string, props: Record<string, unknown>, ...children: Child[]): Element => ({
  type,
  props: { ...props, children: children.filter((child) => child !== false && child !== undefined) },
});

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFile(require.resolve(`${pkg}/files/${file}`));
const dataUri = (buffer: Buffer, type: string) => `data:${type};base64,${buffer.toString('base64')}`;

// Loaded on the first card, so pages that only need socialCardPath stay light
let assets: ReturnType<typeof loadAssets> | undefined;

async function loadAssets() {
  // Static weights: satori draws a variable font only at its default weight
  const [display, semibold, bold, logo] = await Promise.all([
    font('@fontsource/bricolage-grotesque', 'bricolage-grotesque-latin-800-normal.woff2'),
    font('@fontsource/manrope', 'manrope-latin-600-normal.woff2'),
    font('@fontsource/manrope', 'manrope-latin-700-normal.woff2'),
    sharp('public/favicon.svg', { density: 300 }).resize(44, 44).png().toBuffer(),
  ]);
  return {
    fonts: [
      { name: 'Bricolage Grotesque', data: display, weight: 800, style: 'normal' },
      { name: 'Manrope', data: semibold, weight: 600, style: 'normal' },
      { name: 'Manrope', data: bold, weight: 700, style: 'normal' },
    ] as const,
    logo: dataUri(logo, 'image/png'),
  };
}

// Astro keeps the source file of each image in a hidden `fsPath`, so sharp can read the original
function sourceOf(image: ImageMetadata): string {
  const { fsPath } = image as ImageMetadata & { fsPath?: string };
  if (!fsPath) throw new Error(`Social card: no source file for ${image.src}`);
  return fsPath;
}

async function picture(image: ImageMetadata, width: number, height: number, borderRadius = 24) {
  const jpeg = await sharp(sourceOf(image))
    .resize(width, height)
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 90 })
    .toBuffer();
  return h('img', { src: dataUri(jpeg, 'image/jpeg'), width, height, style: { borderRadius } });
}

async function visual(card: SocialCard['visual']) {
  switch (card.kind) {
    case 'photo':
      // Two-tone frame of the home page photo
      return h(
        'div',
        {
          style: {
            display: 'flex',
            alignSelf: 'center',
            padding: 16,
            borderRadius: 56,
            backgroundImage: 'linear-gradient(135deg, #3b5f70 50%, #55aeca 50%)',
          },
        },
        await picture(card.image, 428, 428, 42),
      );
    case 'cover':
      return h(
        'div',
        {
          style: {
            display: 'flex',
            padding: 12,
            borderRadius: 36,
            backgroundColor: '#ffffff',
            boxShadow: '0 24px 48px rgba(20, 24, 27, 0.16)',
          },
        },
        await picture(card.image, 436, 478),
      );
    case 'collage':
      return h(
        'div',
        { style: { display: 'flex', flexWrap: 'wrap', alignSelf: 'center', width: 460, gap: 16 } },
        ...(await Promise.all(card.images.map((image) => picture(image, 222, 222)))),
      );
  }
}

/** Draws the card with the colors of the light theme and returns it as a JPEG. */
export async function renderSocialCard(card: SocialCard): Promise<Uint8Array<ArrayBuffer>> {
  assets ??= loadAssets();
  const { fonts, logo } = await assets;
  const [accentLine, mutedLine] = card.lines;

  const svg = await satori(
    h(
      'div',
      {
        style: {
          display: 'flex',
          boxSizing: 'border-box',
          width: '100%',
          height: '100%',
          padding: 64,
          gap: 56,
          fontFamily: 'Manrope',
          color: '#14181b',
          backgroundColor: '#e8f5fa',
          // The sky band of the site: soft clouds over a gradient
          backgroundImage: [
            'radial-gradient(ellipse 30% 45% at 6% 18%, rgba(255, 255, 255, 0.9) 0%, transparent 70%)',
            'radial-gradient(ellipse 24% 35% at 30% 92%, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
            'radial-gradient(ellipse 28% 40% at 58% 8%, rgba(255, 255, 255, 0.55) 0%, transparent 70%)',
            'radial-gradient(ellipse 30% 50% at 96% 96%, rgba(255, 255, 255, 0.55) 0%, transparent 70%)',
            'linear-gradient(180deg, #b6dfee, #e8f5fa)',
          ].join(', '),
        },
      },
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 } },
        card.eyebrow &&
          h(
            'div',
            {
              style: {
                alignSelf: 'flex-start',
                marginBottom: 28,
                padding: '8px 20px',
                borderRadius: 999,
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                color: '#23718a',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: 'uppercase',
              },
            },
            card.eyebrow,
          ),
        h(
          'div',
          {
            style: {
              fontFamily: 'Bricolage Grotesque',
              fontSize: card.title.length > 18 ? 64 : 80,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -1.5,
              lineClamp: 3,
            },
          },
          card.title,
        ),
        h('div', { style: { width: 72, height: 8, marginTop: 28, borderRadius: 4, backgroundColor: '#55aeca' } }),
        h('div', { style: { marginTop: 24, fontSize: 32, fontWeight: 700, color: '#23718a' } }, accentLine),
        mutedLine && h('div', { style: { marginTop: 10, fontSize: 26, fontWeight: 600, color: '#4a5560' } }, mutedLine),
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 14, marginTop: 'auto', fontSize: 26, fontWeight: 700 } },
          h('img', { src: logo, width: 44, height: 44 }),
          new URL(import.meta.env.SITE).hostname,
        ),
      ),
      await visual(card.visual),
    ),
    { ...socialCardSize, fonts: [...fonts] },
  );

  return new Uint8Array(await sharp(Buffer.from(svg)).jpeg({ quality: 85, mozjpeg: true }).toBuffer());
}
