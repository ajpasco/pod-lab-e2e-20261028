// The rules: the commands and the order of checks (command word, then the arguments, then the
// file). No I/O here: the lines to print are returned and every failure is a thrown ShelfError.
import { ShelfError, readShelf, writeShelf } from './store.mjs';

export { ShelfError };

function add(args) {
  if (args.length === 0) throw new ShelfError('argument', 'add needs a title');
  const title = args.join(' ').trim();
  if (title === '') throw new ShelfError('argument', 'the title is empty');
  const shelf = readShelf();
  const id = shelf.nextId;
  shelf.books.push({ id, status: 'to read', title });
  shelf.nextId = id + 1;
  writeShelf(shelf);
  return [`added ${id} ${title}`];
}

// Sorted here so that a hand-edited order in the file never leaks into the output.
function list() {
  const shelf = readShelf();
  const books = [...shelf.books].sort((a, b) => a.id - b.id);
  return books.map((book) => `${book.id} ${book.status} ${book.title}`);
}

// A numeric id is a string of decimal digits and denotes the number it spells, so 007 is book 7.
function parseId(command, args) {
  const [raw] = args;
  if (raw === undefined) throw new ShelfError('argument', `${command} needs an id`);
  if (!/^[0-9]+$/.test(raw)) throw new ShelfError('argument', `not a numeric id: ${raw}`);
  return Number(raw);
}

// The file is read only once the id has passed its check, so an argument error beats a file error.
function findBook(command, args) {
  const id = parseId(command, args);
  const shelf = readShelf();
  const book = shelf.books.find((candidate) => candidate.id === id);
  if (book === undefined) throw new ShelfError('unknown-id', `no book with id ${id}`);
  return { shelf, book };
}

// Rewritten even when the book was already read, so the command behaves the same on every book.
function done(args) {
  const { shelf, book } = findBook('done', args);
  book.status = 'read';
  writeShelf(shelf);
  return [`done ${book.id} ${book.title}`];
}

// nextId is left as it is, so a dropped id is never reused.
function drop(args) {
  const { shelf, book } = findBook('drop', args);
  shelf.books = shelf.books.filter((candidate) => candidate !== book);
  writeShelf(shelf);
  return [`dropped ${book.id} ${book.title}`];
}

const COMMANDS = new Map([
  ['add', add],
  ['list', list],
  ['done', done],
  ['drop', drop],
]);

// The one entry point: the arguments after the program name in, the stdout lines out.
export function run(args) {
  const [word, ...rest] = args;
  if (word === undefined) throw new ShelfError('usage', '');
  const command = COMMANDS.get(word);
  if (command === undefined) throw new ShelfError('usage', `unknown command: ${word}`);
  return command(rest);
}
