// The boundary: argv in, stdout, stderr and the exit code out. It decides nothing about books.
import { ShelfError, run } from './src/shelf.mjs';

const USAGE = [
  'usage: shelf <command>',
  '  add <title...>   add a book',
  '  list             list the books',
  '  done <id>        mark a book read',
  '  drop <id>        remove a book',
].join('\n');

const EXIT_CODES = {
  usage: 2,
  argument: 2,
  'unknown-id': 1,
  unreadable: 1,
  corrupt: 1,
  unwritable: 1,
};

function reportRefusal(error) {
  if (error.message !== '') console.error(`shelf: ${error.message}`);
  if (error.kind === 'usage') console.error(USAGE);
}

function main(argv) {
  try {
    const lines = run(argv);
    if (lines.length > 0) process.stdout.write(lines.join('\n') + '\n');
    return 0;
  } catch (error) {
    const code = error instanceof ShelfError ? EXIT_CODES[error.kind] : undefined;
    if (code === undefined) {
      console.error('shelf: unexpected error');
      console.error(error.stack ?? String(error));
      return 1;
    }
    reportRefusal(error);
    return code;
  }
}

// exitCode rather than exit(), so stdout is flushed before the process ends.
process.exitCode = main(process.argv.slice(2));
