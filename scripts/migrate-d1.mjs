#!/usr/bin/env node
// Aplica TODAS las migraciones de db/migrations/ a la D1 (local o remota).
// Tolerante a "already exists" / "duplicate column" / "no such column" para poder
// correrlo N veces (las migraciones son aditivas o DROP COLUMN idempotentes).
//
//   pnpm db:migrate:local                        (default, coopen-places-db)
//   pnpm db:migrate:remote                       (⚠️ contra la D1 real — confirmar antes)
//   node scripts/migrate-d1.mjs --remote --db=otro-nombre

import { readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = resolve(root, 'db/migrations');
const dbArg = process.argv.find((a) => a.startsWith('--db='));
const DB_NAME = dbArg ? dbArg.slice('--db='.length) : 'coopen-places-db';
const envArg = process.argv.find((a) => a.startsWith('--env='));
const ENV_ARGS = envArg ? ['--env', envArg.slice('--env='.length)] : [];

const isRemote = process.argv.includes('--remote');
const flag = isRemote ? '--remote' : '--local';
const isWin = process.platform === 'win32';

const files = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
if (files.length === 0) {
  console.error('No hay migraciones en db/migrations/.');
  process.exit(1);
}

let applied = 0, skipped = 0, failed = 0;
console.log(`Aplicando ${files.length} migraciones a ${DB_NAME} (${flag})...\n`);

for (const file of files) {
  process.stdout.write(`→ ${file} ... `);
  const res = spawnSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB_NAME, flag, ...ENV_ARGS, `--file=db/migrations/${file}`],
    { cwd: root, encoding: 'utf8', shell: isWin },
  );
  const out = `${res.stdout || ''}\n${res.stderr || ''}`;
  if (res.status === 0) {
    applied++;
    process.stdout.write('✓ aplicada\n');
  } else if (/already exists|duplicate column name|no such column/i.test(out)) {
    skipped++;
    process.stdout.write('— ya aplicada (skip)\n');
  } else {
    failed++;
    process.stdout.write('✗ error\n');
    const snippet = out.split('\n').filter((l) => /error/i.test(l)).slice(0, 3).join('\n   ');
    if (snippet) console.error('   ' + snippet);
  }
}

console.log(`\nResultado: ${applied} aplicadas, ${skipped} ya existían, ${failed} fallaron.`);
process.exit(failed > 0 ? 1 : 0);
