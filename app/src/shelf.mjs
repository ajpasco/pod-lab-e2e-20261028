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

const COMMANDS = new Map([
  ['add', add],
  ['list', list],
]);

// The one entry point: the arguments after the program name in, the stdout lines out.
export function run(args) {
  const [word, ...rest] = args;
  if (word === undefined) throw new ShelfError('usage', '');
  const command = COMMANDS.get(word);
  if (command === undefined) throw new ShelfError('usage', `unknown command: ${word}`);
  return command(rest);
}
