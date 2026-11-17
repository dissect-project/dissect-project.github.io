// Generate favicons and the social preview image from the brand icon.
// Run after changing brand/3-icon: `npm run gen-icons` (outputs are committed).
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { copyFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const brand = (p) => fileURLToPath(new URL(`../brand/${p}`, import.meta.url));
const out = (p) => fileURLToPath(new URL(`../public/${p}`, import.meta.url));
const icon512 = brand('3-icon/dissect-icon-light-512.png');

// The icon's rounded square sits 4% in from each edge; resize it as-is.
await sharp(icon512).resize(32, 32).png().toFile(out('icon-32.png'));
await sharp(icon512).resize(180, 180).flatten({ background: '#F5F5F1' }).png().toFile(out('apple-touch-icon.png'));
const ico = await pngToIco([
  await sharp(icon512).resize(16, 16).png().toBuffer(),
  await sharp(icon512).resize(32, 32).png().toBuffer(),
  await sharp(icon512).resize(48, 48).png().toBuffer(),
]);
await writeFile(out('favicon.ico'), ico);
await copyFile(brand('3-icon/dissect-icon-light.svg'), out('icon.svg'));

// 1200x630 social preview: icon centred on paper.
const size = 360;
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#F5F5F1' } })
  .composite([{ input: await sharp(icon512).resize(size, size).png().toBuffer(), left: (1200 - size) / 2, top: (630 - size) / 2 }])
  .png()
  .toFile(out('og.png'));

console.log('Icons written to public/');
