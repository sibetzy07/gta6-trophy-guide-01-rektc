// Hand in the GTA VI trophy guide: this program takes the guide's own files
// (app/ — the page, its script, its styles and its trophy data — and
// screenshots/ — the four renders of the running app) and lays them out in
// the output directory, then writes dossier.json there with make.fun's own
// library. The dossier is the summary the judge reads: the screenshots, the
// files the first load fetches and their bytes, and the source. Leave
// vendor/makefun-frontend.ts alone — the scorer rebuilds the dossier from its
// own identical copy and refuses one that does not match byte for byte.
//
// The guide itself is plain static files a browser opens at app/index.html
// (an ES module script, CSS, a JSON data file, no build step) and runs
// offline: it loads nothing over the network, and its only links out are the
// source citations beside each trophy's guide, opened only when the reader
// follows them.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the rest refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB, more than 993 files and directories in
// app/ or 48 MiB of app files (app/ counts beside /output's own 1,000-entry
// cap, with its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
