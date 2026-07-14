/**
 * Generates PWA icons from the brand heart mark (same design as
 * src/app/icon.svg). Rerun after a rebrand: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const ROSEWOOD = "#7A2E3A";
const CREAM = "#FAF4EC";

// scale < 1 shrinks the heart toward the center (maskable safe zone).
function heartSvg({ size, radius, scale = 1 }) {
  const s = size / 32;
  const offset = (32 * (1 - scale)) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${ROSEWOOD}"/>
  <g transform="scale(${s}) translate(${offset} ${offset}) scale(${scale})">
    <path d="M16 26.5 C7 20 4.2 13.6 8.4 9.8 C11.3 7.2 15 8.4 16 11.6 C17 8.4 20.7 7.2 23.6 9.8 C27.8 13.6 25 20 16 26.5 Z" fill="${CREAM}"/>
  </g>
</svg>`);
}

const targets = [
  // Standard launcher icons (rounded corners baked in).
  { file: "public/icon-192.png", size: 192, radius: 42, scale: 1 },
  { file: "public/icon-512.png", size: 512, radius: 112, scale: 1 },
  // Maskable: square canvas, artwork inside the ~80% safe zone.
  { file: "public/icon-maskable-512.png", size: 512, radius: 0, scale: 0.78 },
  // iOS home screen (Next serves src/app/apple-icon.png automatically).
  { file: "src/app/apple-icon.png", size: 180, radius: 0, scale: 0.9 },
];

await mkdir("public", { recursive: true });
for (const t of targets) {
  await sharp(heartSvg(t)).png().toFile(t.file);
  console.log(`wrote ${t.file} (${t.size}x${t.size})`);
}
