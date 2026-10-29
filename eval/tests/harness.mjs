// Shared by the test files: starts the application as a child process and stages a directory.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT_ERROR = 'cannot stage: running as root';

function shelfFile(dir) {
  return path.join(dir, 'shelf.json');
}

export function run(args, cwd) {
  const result = spawnSync(process.execPath, [path.resolve('app/shelf.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 30000,
  });
  return { stdout: result.stdout ?? '', stderr: result.stderr ?? '', status: result.status };
}

export function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'shelf-'));
}

export function stage(dir, doc) {
  const content = typeof doc === 'string' ? doc : JSON.stringify(doc, null, 2) + '\n';
  fs.writeFileSync(shelfFile(dir), content);
}

export function book(id, status, title) {
  return { id, status, title };
}

export function shelf(books, nextId) {
  const highest = books.reduce((most, one) => Math.max(most, one.id), 0);
  return { nextId: nextId === undefined ? highest + 1 : nextId, books };
}

export function bytes(dir) {
  try {
    return fs.readFileSync(shelfFile(dir));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export function listing(dir) {
  return fs.readdirSync(dir).sort();
}

export function makeUnreadable(dir) {
  const file = shelfFile(dir);
  fs.chmodSync(file, 0o000);
  let readable = true;
  try {
    fs.accessSync(file, fs.constants.R_OK);
  } catch {
    readable = false;
  }
  if (readable) throw new Error(ROOT_ERROR);
}

export function makeUnwritableFile(dir) {
  const file = shelfFile(dir);
  fs.chmodSync(file, 0o444);
  let writable = true;
  try {
    fs.closeSync(fs.openSync(file, 'r+'));
  } catch {
    writable = false;
  }
  if (writable) throw new Error(ROOT_ERROR);
}

export function makeUnwritableDir(dir) {
  fs.chmodSync(dir, 0o555);
  const probe = path.join(dir, '.stage-probe');
  let writable = true;
  try {
    fs.writeFileSync(probe, '', { flag: 'wx' });
  } catch {
    writable = false;
  }
  if (writable) {
    fs.rmSync(probe, { force: true });
    throw new Error(ROOT_ERROR);
  }
}

export function restore(dir) {
  try {
    fs.chmodSync(dir, 0o755);
  } catch {
    // the directory may already be gone; nothing to restore
  }
  try {
    fs.chmodSync(shelfFile(dir), 0o644);
  } catch {
    // the file may be absent; nothing to restore
  }
}
