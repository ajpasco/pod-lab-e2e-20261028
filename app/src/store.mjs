// The store: every read and write of shelf.json, its checks and its errors. It knows no command.
import fs from 'node:fs';

const SHELF_FILE = 'shelf.json';
// Same directory as shelf.json, so the rename that replaces the file is atomic.
const TEMP_FILE = '.shelf.json.tmp';
const STATUSES = ['to read', 'read'];

export class ShelfError extends Error {
  constructor(kind, message) {
    super(message);
    this.name = 'ShelfError';
    this.kind = kind;
  }
}

function isPositiveInteger(value) {
  return Number.isSafeInteger(value) && value >= 1;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isBook(value) {
  return (
    isObject(value) &&
    isPositiveInteger(value.id) &&
    STATUSES.includes(value.status) &&
    typeof value.title === 'string' &&
    value.title !== ''
  );
}

// The fixed fault phrase of a parsed document that is not the shape shelf writes, or null.
function shapeFault(parsed) {
  if (!isObject(parsed)) return 'not an object';
  if (!Array.isArray(parsed.books)) return 'books is not a list';
  if (!isPositiveInteger(parsed.nextId)) return 'nextId is not a positive integer';
  if (!parsed.books.every(isBook)) return 'a book is malformed';
  const ids = parsed.books.map((book) => book.id);
  if (new Set(ids).size !== ids.length) return 'two books share an id';
  if (ids.some((id) => id >= parsed.nextId)) return 'nextId is not above every id';
  return null;
}

// Only the fields shelf writes survive, so a field it did not write is dropped on rewrite.
function document(shelf) {
  return {
    nextId: shelf.nextId,
    books: shelf.books.map((book) => ({ id: book.id, status: book.status, title: book.title })),
  };
}

function readText() {
  try {
    return fs.readFileSync(SHELF_FILE, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new ShelfError('unreadable', `cannot read shelf.json (${error.code})`);
  }
}

function parse(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new ShelfError('corrupt', 'shelf.json is not valid JSON; fix or remove it');
  }
}

// A missing file is the empty shelf and creates nothing; only a successful write creates it.
export function readShelf() {
  const text = readText();
  if (text === null) return { nextId: 1, books: [] };
  const parsed = parse(text);
  const fault = shapeFault(parsed);
  if (fault !== null) {
    throw new ShelfError('corrupt', `shelf.json is not a shelf (${fault}); fix or remove it`);
  }
  return document(parsed);
}

// The rename below would replace a read-only file in a writable directory, so the explicit
// check is what refuses a file that cannot be written. An absent file is fine: it will be created.
function checkWritable() {
  try {
    fs.accessSync(SHELF_FILE, fs.constants.W_OK);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

// Written whole to a temporary file and renamed over shelf.json, so a kill or a full disk
// mid-write leaves the old file intact rather than truncated.
export function writeShelf(shelf) {
  const text = JSON.stringify(document(shelf), null, 2) + '\n';
  try {
    checkWritable();
    fs.writeFileSync(TEMP_FILE, text);
    fs.renameSync(TEMP_FILE, SHELF_FILE);
  } catch (error) {
    fs.rmSync(TEMP_FILE, { force: true });
    throw new ShelfError('unwritable', `cannot write shelf.json (${error.code})`);
  }
}
