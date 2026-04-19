#!/usr/bin/env node
// Transcode the staged Higgsfield MP4 into WebM + extract AVIF poster.
// Phase 0 does NOT regenerate via Higgsfield — that path is gated behind --regenerate (Phase 1+).
//
// Usage:
//   node scripts/generate-hero.mjs --source /tmp/cc-site-assets/hero/hero.mp4
//   node scripts/generate-hero.mjs --regenerate  (Phase 1+, calls Higgsfield API)
//
// Requires: ffmpeg in PATH, sharp installed.

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_HERO = resolve(__dirname, '..', 'public', 'hero');

const args = process.argv.slice(2);
const sourceFlag = args.indexOf('--source');
const regenerate = args.includes('--regenerate');
const source = sourceFlag >= 0 ? args[sourceFlag + 1] : '/tmp/cc-site-assets/hero/hero.mp4';

if (regenerate) {
  console.error('--regenerate path not implemented in Phase 0. Requires security review of Higgsfield MCP first.');
  process.exit(2);
}

if (!existsSync(source)) {
  console.error(`Source file not found: ${source}`);
  console.error('Stage bubble.mp4 at the source path or pass --source <path>.');
  process.exit(1);
}

mkdirSync(PUBLIC_HERO, { recursive: true });

const destMp4 = resolve(PUBLIC_HERO, 'hero.mp4');
const destWebm = resolve(PUBLIC_HERO, 'hero.webm');
const destPoster = resolve(PUBLIC_HERO, 'hero-poster.avif');

console.log(`[1/3] Copying MP4 → ${destMp4}`);
copyFileSync(source, destMp4);

console.log(`[2/3] Transcoding WebM (VP9) → ${destWebm}`);
execSync(
  `ffmpeg -y -i "${source}" -c:v libvpx-vp9 -b:v 0 -crf 32 -pix_fmt yuv420p -an "${destWebm}"`,
  { stdio: 'inherit' }
);

console.log(`[3/3] Extracting AVIF poster → ${destPoster}`);
const tmpPng = resolve(PUBLIC_HERO, '.poster.png');
execSync(`ffmpeg -y -i "${source}" -vf "select=eq(n\\,0)" -vframes 1 "${tmpPng}"`, {
  stdio: 'inherit',
});
await sharp(tmpPng).avif({ quality: 60 }).toFile(destPoster);
execSync(`rm "${tmpPng}"`);

const { statSync } = await import('node:fs');
console.log('\n=== Output sizes ===');
console.log(`  hero.mp4:          ${(statSync(destMp4).size / 1024).toFixed(0)} KB`);
console.log(`  hero.webm:         ${(statSync(destWebm).size / 1024).toFixed(0)} KB`);
console.log(`  hero-poster.avif:  ${(statSync(destPoster).size / 1024).toFixed(0)} KB`);
console.log('\nDone. Commit these three files.');
