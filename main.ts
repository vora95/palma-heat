// Palma Heat — entrypoint for make.fun bounty gta6-01 (Node 22, stdlib only).
//
// What this program does, in plain terms: it gathers the finished game
// (the static files under game/ plus the screenshots/ folder next to this
// file) into the output directory the grader reads, and it asks the
// vendored make.fun library to write the dossier.json summary that the
// judge compares against the same library's own computation. Nothing is
// downloaded, nothing is generated at random, and running it twice over
// the same tree produces the same bytes.
//
// Local preview:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play locally:   node serve.ts  (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The folder this file lives in, and the folder the grader collects.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// The scorer's own caps (from the bounty kit): at most 4 screenshots of at
// most 256 KiB each, at most 993 files totalling 48 MiB under game/, no game
// path longer than 1000 bytes, and at most 160 KiB of text in the dossier.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function countFiles(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = countFiles(full);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

function fail(message) {
  console.error(`palma-heat: ${message}`);
  process.exit(1);
}

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(gameDir)) fail('game/ is missing — nothing to hand in');
if (!existsSync(shotsDir)) fail('screenshots/ is missing — the judge needs images of the game');

// Refuse early, with a readable message, when a screenshot breaks the cap
// instead of letting the dossier builder throw a bare limit error.
const shotNames = readdirSync(shotsDir).filter((n) => statSync(join(shotsDir, n)).isFile());
if (shotNames.length === 0 || shotNames.length > DOSSIER_CAPS.screenshots.max) {
  fail(`expected 1-${DOSSIER_CAPS.screenshots.max} screenshots, found ${shotNames.length}`);
}
for (const name of shotNames) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > DOSSIER_CAPS.screenshots.max_bytes) {
    fail(`screenshot ${name} is ${size} bytes, over the ${DOSSIER_CAPS.screenshots.max_bytes} byte cap`);
  }
}

// Copy the tree, then write the dossier from the copy (never from the repo
// directly) so the summary always describes exactly what was handed in.
mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, DOSSIER_CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);

const gameStats = countFiles(join(outDir, 'game'));
console.log(
  `palma-heat: handed in ${gameStats.files} game files (${gameStats.bytes} bytes), ` +
  `${shotNames.length} screenshots, dossier ${Buffer.byteLength(dossier)} bytes -> ${outDir}`,
);
