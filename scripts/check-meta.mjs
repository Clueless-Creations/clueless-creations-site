#!/usr/bin/env node
// Verify every built HTML page has title, description, canonical, og:image.
// Fails build if any page is missing required meta.

import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');

const pages = readdirSync(DIST).filter(f => f.endsWith('.html'));
if (pages.length === 0) {
  console.error(`No HTML files in ${DIST}. Run 'pnpm build' first.`);
  process.exit(1);
}

const required = [
  { name: 'title',          test: html => /<title>[^<]{5,60}<\/title>/.test(html) },
  { name: 'description',    test: html => /<meta\s+name="description"\s+content="[^"]{40,200}"/.test(html) },
  { name: 'canonical',      test: html => /<link\s+rel="canonical"\s+href="[^"]+"/.test(html) },
  { name: 'og:image',       test: html => /<meta\s+property="og:image"\s+content="[^"]+"/.test(html) },
  { name: 'og:title',       test: html => /<meta\s+property="og:title"/.test(html) },
  { name: 'og:description', test: html => /<meta\s+property="og:description"/.test(html) },
];

let errors = 0;
for (const page of pages) {
  const html = readFileSync(resolve(DIST, page), 'utf-8');
  for (const check of required) {
    if (!check.test(html)) {
      console.error(`  [FAIL] ${page} — missing or malformed ${check.name}`);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} meta check failure(s) across ${pages.length} pages.`);
  process.exit(1);
}
console.log(`✓ All ${pages.length} pages have required meta tags.`);
