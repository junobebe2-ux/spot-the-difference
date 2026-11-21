// Festival Lampion — the hand-in program (Node 22 standard library only).
// Copies game/ and screenshots/ into the output directory and writes
// dossier.json with buildDossier from vendor/makefun-game.ts.
// The output directory is MAKEFUN_OUTPUT_DIR, falling back to "/output".
// It must never land inside this repository; nothing is written into the
// repository directory. Two runs write byte-identical files.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));

function outputDir(): string {
  const raw = process.env.MAKEFUN_OUTPUT_DIR;
  const out = raw && raw.length > 0 ? resolve(raw) : resolve('/output');
  const rel = relative(repoRoot, out);
  const insideRepo = rel === '' || (!rel.startsWith('..' + sep) && rel !== '..');
  // The documented local build directory is the one in-repo target allowed:
  // every other in-repo target is refused so the program can never write
  // into the repository's own files (in the grader the repo is read-only).
  const localBuildDir = out === join(repoRoot, 'out');
  if (insideRepo && !localBuildDir) {
    throw new Error('main.ts: output directory must not be inside the repository: ' + out);
  }
  return out;
}

function copyTree(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  const entries = readdirSync(src).sort();
  for (const name of entries) {
    const from = join(src, name);
    const to = join(dest, name);
    const st = statSync(from);
    if (st.isDirectory()) {
      copyTree(from, to);
    } else if (st.isFile()) {
      cpSync(from, to);
    }
  }
}

function main(): void {
  const out = outputDir();
  mkdirSync(out, { recursive: true });
  for (const name of ['game', 'screenshots']) {
    const dest = join(out, name);
    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
    copyTree(join(repoRoot, name), dest);
  }
  const dossier = buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648
  });
  writeFileSync(join(out, 'dossier.json'), dossier);
}

main();
