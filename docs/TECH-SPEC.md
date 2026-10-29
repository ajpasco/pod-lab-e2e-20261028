# Technical blueprint: shelf

Revision 11

Blueprint of PRD revision 10 and mockup revision 6. (PRD revisions 6 and 7 changed one non-functional sentence, carried here as D11, and the tag legend; PRD revision 9 added increment amendment 1, carried here as section 14, delta 1, with no requirement or criterion changed; PRD revision 10 added REQ-08 c5 by increment amendment 2, carried here as section 14, delta 2.) Every `REQ-nn` below is an id the PRD gave; this
document creates none. `D-<n>` with a hyphen is a defect record, `docs/defects/D-<n>.md`.

Deciders are named as: **the user** (a recorded answer, Q-number or D-number of the preparation
state), **recorded default** (this blueprint's choice where the user did not decide, open to the
user's change; **recorded default, accepted by the user** where the user has since accepted it, with
its Q and D numbers), or **PRD clause** (the PRD already fixes it, no question is recorded).

## 1. Profile and fit

Node 22, plain JavaScript as ES modules (`.mjs`), no dependencies, no build step, run as a command
(`node app/shelf.mjs <args>`) on the reader's own machine; state in `shelf.json` in the current
directory. [PRD section 6; D2]

It fits because the whole product is four commands over one small local file for one person: the
Node standard library reads and writes the file, and nothing needs a server, a database or a package.

## 2. Layers and dependency direction

| Layer | File | Owns | Never does |
|---|---|---|---|
| Boundary | `app/shelf.mjs` | Reads `process.argv`, calls the one rule entry point, prints lines to stdout or the error to stderr, sets `process.exitCode`; holds the usage text and the table from error kind to exit code | Decides anything about books or checks anything about a title or id; touches the file system |
| Rules | `app/src/shelf.mjs` | `add`, `list`, `done`, `drop`, and the order of checks (command word, then title or id, then the file); the argument error messages | Reads `process`, prints, or touches the file system directly |
| Store | `app/src/store.mjs` | Every read and write of `shelf.json`; detects missing, unreadable, corrupt (invalid JSON or wrong shape) and unwritable; the file error messages; the error class | Knows a command, a title rule or an exit code |

Dependency direction, one way: **boundary to rules to store**. A module imports only the layer
directly below it; nothing imports upward and the boundary never imports the store. The error class
`ShelfError` (a `kind` and a message) is defined once in `store.mjs` and re-exported by
`app/src/shelf.mjs`, so the boundary imports it from the rules. [D2 for the three files and the
direction; the error class placement is a recorded default]

The acceptance tests are outside this tree: they start `node app/shelf.mjs <args>` as a child process
with the working directory set to a fresh temporary directory, and never import `app/`. [recorded
default]

## 3. Requirements by layer or phase

Each requirement appears once, under the layer that owns its decision. The boundary owns no
requirement of its own: it only renders the outcome of every requirement (stdout, stderr, exit
code), as the tables in section 5 and the message table below fix.

| Layer | Requirements |
|---|---|
| Rules | REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 |
| Store | REQ-06, REQ-07, REQ-08, REQ-09 |

## 4. Verification register

One row per acceptance criterion (81: the 80 of the PRD's first build and REQ-08 c5, added by section 14, delta 2). Every mechanism is an acceptance row run with `node --test`,
which spawns `node app/shelf.mjs` in a fresh temporary directory, stages the state in words from the
mockup (writing `shelf.json` in the shape of section 7 where a state is needed), and observes only
stdout, stderr, the exit code and the bytes on disk. Rows observe titles and ids through `shelf list`,
never by reading the file's fields. The `eval/` runner turns the `node --test` TAP output into one
`pass <id>` or `fail <id> <reason>` line per row in `eval/report/rows.txt`; that line is the evidence
of every row, so the Evidence column says "its `rows.txt` line". Row ids are `T-REQ-nn-…`, assigned
at gate 5. Per Q14 the rows check that stderr is non-empty and never its words, with one exception under D11: the unknown-command rows also check that the usage on stderr contains the four command words. "Untouched" is a
byte-for-byte comparison of `shelf.json` (and, where it was absent, that it is still absent); "no
other change on disk" is the same comparison of the whole directory listing.

Rows marked **[non-root]** need file permissions removed (`chmod`) and so cannot run as root; see the
paragraph after the table and Open points 2.

| Criterion | Mechanism | Evidence it produces |
|---|---|---|
| REQ-01 c1 | Row T-REQ-01-… assigned at gate 5: in a directory with no file, and again with a file that has never held a book, `add Dune` prints exactly `added 1 Dune`, exit 0 | its `rows.txt` line |
| REQ-01 c2 | Row T-REQ-01-… assigned at gate 5: after c1, `add Emma` prints exactly `added 2 Emma`, exit 0 | its `rows.txt` line |
| REQ-01 c3 | Row T-REQ-01-… assigned at gate 5: `add Dune Messiah` prints exactly `added <id> Dune Messiah` | its `rows.txt` line |
| REQ-01 c4 | Row T-REQ-01-… assigned at gate 5: after `add`, `list` prints `<id> to read <title>` | its `rows.txt` line |
| REQ-01 c5 | Row T-REQ-01-… assigned at gate 5: `add Dune` twice; `list` shows two lines with different ids | its `rows.txt` line |
| REQ-01 c6 | Row T-REQ-01-… assigned at gate 5: books 1, 2, 3, `drop 3`, `add X` prints `added 4 X` | its `rows.txt` line |
| REQ-01 c7 | Row T-REQ-01-… assigned at gate 5: books 1, 2 dropped, `list` empty, `add Ulysses` prints an id higher than 2 (`added 3 Ulysses`) | its `rows.txt` line |
| REQ-01 c8 | Row T-REQ-01-… assigned at gate 5: with no `shelf.json`, `add Dune` exits 0 and `shelf.json` now exists in the working directory | its `rows.txt` line |
| REQ-01 c9 | Row T-REQ-01-… assigned at gate 5: `add` alone exits 2, stderr non-empty, stdout empty, `list` unchanged | its `rows.txt` line |
| REQ-01 c10 | Row T-REQ-01-… assigned at gate 5: `add ""` exits 2, stderr non-empty, stdout empty, `list` unchanged | its `rows.txt` line |
| REQ-01 c11 | Row T-REQ-01-… assigned at gate 5: `add "   "` exits 2, stderr non-empty, stdout empty, `list` unchanged | its `rows.txt` line |
| REQ-01 c12 | Row T-REQ-01-… assigned at gate 5: `add "  Dune "` prints exactly `added <id> Dune`; `list` shows the title `Dune` | its `rows.txt` line |
| REQ-01 c13 | Row T-REQ-01-… assigned at gate 5: with a file that is not valid JSON, `add ""` exits 2, stderr non-empty, stdout empty, file untouched | its `rows.txt` line |
| REQ-01 c14 | Row T-REQ-01-… assigned at gate 5: with a file that is not valid JSON, `add` alone exits 2, stderr non-empty, stdout empty, file untouched | its `rows.txt` line |
| REQ-02 c1 | Row T-REQ-02-… assigned at gate 5: books `1 to read Dune`, `2 read Emma`; `list` prints exactly those two lines | its `rows.txt` line |
| REQ-02 c2 | Row T-REQ-02-… assigned at gate 5: books added 1, 2, 3 then 3 and 1 marked read, with the file staged so that the stored order is not ascending as well; `list` prints ascending id order | its `rows.txt` line |
| REQ-02 c3 | Row T-REQ-02-… assigned at gate 5: a file holding no books; `list` prints nothing on stdout, exit 0 | its `rows.txt` line |
| REQ-02 c4 | Row T-REQ-02-… assigned at gate 5: with books, `list` exits 0 | its `rows.txt` line |
| REQ-02 c5 | Row T-REQ-02-… assigned at gate 5: `list` leaves `shelf.json` byte-for-byte untouched | its `rows.txt` line |
| REQ-02 c6 | Row T-REQ-02-… assigned at gate 5: two directories with different files; `list` in each shows that directory's books | its `rows.txt` line |
| REQ-02 c7 | Row T-REQ-02-… assigned at gate 5: `list x` prints and exits as `list` does | its `rows.txt` line |
| REQ-03 c1 | Row T-REQ-03-… assigned at gate 5: `done 1` on `Dune` prints exactly `done 1 Dune`, exit 0; `list` shows `1 read Dune` | its `rows.txt` line |
| REQ-03 c2 | Row T-REQ-03-… assigned at gate 5: after `done 1`, book 2 is still `2 to read Emma` in `list` | its `rows.txt` line |
| REQ-03 c3 | Row T-REQ-03-… assigned at gate 5: `done 1` on an already read book prints `done 1 Dune`, exit 0; `list` still shows it read | its `rows.txt` line |
| REQ-03 c4 | Row T-REQ-03-… assigned at gate 5: `done` alone exits 2, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-03 c5 | Row T-REQ-03-… assigned at gate 5: each of `abc`, `1.5`, `-1`, `1a`, `+1` exits 2, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-03 c6 | Row T-REQ-03-… assigned at gate 5: `done 99` with no book 99 exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-03 c7 | Row T-REQ-03-… assigned at gate 5: `done 0` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-03 c8 | Row T-REQ-03-… assigned at gate 5: with books 1 to 7, `done 007` prints exactly `done 7 Ulysses`; `list` shows book 7 read and 1 to 6 unchanged | its `rows.txt` line |
| REQ-03 c9 | Row T-REQ-03-… assigned at gate 5: `done 1 2` prints `done 1 Dune` and only book 1 changes | its `rows.txt` line |
| REQ-03 c10 | Row T-REQ-03-… assigned at gate 5: after `done` alone, `done abc` and `done 99`, the file is untouched and `list` shows every book unchanged | its `rows.txt` line |
| REQ-03 c11 | Row T-REQ-03-… assigned at gate 5: with a file that is not valid JSON, `done abc` exits 2, stderr non-empty, stdout empty, file untouched | its `rows.txt` line |
| REQ-03 c12 | **[non-root]** Row T-REQ-03-… assigned at gate 5: with `shelf.json` made unreadable by `chmod`, `done` alone exits 2, stderr non-empty, stdout empty, file untouched. The row first checks that its own process cannot read the file; if it can (root), the staging did not take effect and the row is a gap, not a pass. Gap handling: Open points 2 | its `rows.txt` line; if the gate runs as root, the gap recorded at gate 5 in the eval plan |
| REQ-03 c13 | Row T-REQ-03-… assigned at gate 5: `done 007` with only book 1 exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-03 c14 | Row T-REQ-03-… assigned at gate 5: `done ""` exits 2, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-04 c1 | Row T-REQ-04-… assigned at gate 5: `drop 2` on `Emma` prints exactly `dropped 2 Emma`, exit 0; `list` no longer shows it | its `rows.txt` line |
| REQ-04 c2 | Row T-REQ-04-… assigned at gate 5: after `drop 2`, books 1 and 3 keep id, status and title in `list` | its `rows.txt` line |
| REQ-04 c3 | Row T-REQ-04-… assigned at gate 5: one read and one to-read book are each dropped, exit 0 | its `rows.txt` line |
| REQ-04 c4 | Row T-REQ-04-… assigned at gate 5: `drop` alone exits 2, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-04 c5 | Row T-REQ-04-… assigned at gate 5: each of `abc`, `1.5`, `-1`, `1a`, `+1` exits 2, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-04 c6 | Row T-REQ-04-… assigned at gate 5: `drop 99` with no book 99 exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-04 c7 | Row T-REQ-04-… assigned at gate 5: `drop 0` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-04 c8 | Row T-REQ-04-… assigned at gate 5: with books 1 to 7, `drop 007` prints exactly `dropped 7 Ulysses`; `list` shows books 1 to 6 only | its `rows.txt` line |
| REQ-04 c9 | Row T-REQ-04-… assigned at gate 5: `drop 1 2` prints `dropped 1 Dune`; `list` shows book 2 only | its `rows.txt` line |
| REQ-04 c10 | Row T-REQ-04-… assigned at gate 5: after `drop` alone, `drop abc` and `drop 99`, the file is untouched and `list` shows every book unchanged | its `rows.txt` line |
| REQ-04 c11 | Row T-REQ-04-… assigned at gate 5: with a file that is not valid JSON, `drop abc` exits 2, stderr non-empty, stdout empty, file untouched | its `rows.txt` line |
| REQ-04 c12 | Row T-REQ-04-… assigned at gate 5: `drop 007` with only book 1 exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-04 c13 | Row T-REQ-04-… assigned at gate 5: `drop ""` exits 2, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-04 c14 | Row T-REQ-04-… assigned at gate 5: with a file that is not valid JSON, `drop` alone exits 2, stderr non-empty, stdout empty, file untouched | its `rows.txt` line |
| REQ-05 c1 | Row T-REQ-05-… assigned at gate 5: `frobnicate` exits 2, usage on stderr containing `add`, `list`, `done` and `drop`, stdout empty | its `rows.txt` line |
| REQ-05 c2 | Row T-REQ-05-… assigned at gate 5: bare `shelf` exits 2, usage on stderr containing `add`, `list`, `done` and `drop`, stdout empty | its `rows.txt` line |
| REQ-05 c3 | Row T-REQ-05-… assigned at gate 5: `search x` and `rate 1 5` each exit 2, usage on stderr containing `add`, `list`, `done` and `drop`, stdout empty | its `rows.txt` line |
| REQ-05 c4 | Row T-REQ-05-… assigned at gate 5: with a file holding book 1, `frobnicate` leaves the file untouched | its `rows.txt` line |
| REQ-05 c5 | Row T-REQ-05-… assigned at gate 5: with a file that is not valid JSON, `frobnicate` exits 2, usage on stderr containing `add`, `list`, `done` and `drop`, stdout empty, file untouched | its `rows.txt` line |
| REQ-06 c1 | Row T-REQ-06-… assigned at gate 5: with no file, `list` prints nothing, exit 0 | its `rows.txt` line |
| REQ-06 c2 | Row T-REQ-06-… assigned at gate 5: with no file, after `list` the directory listing is still empty | its `rows.txt` line |
| REQ-06 c3 | Row T-REQ-06-… assigned at gate 5: with no file, `done 1` exits 1, stderr non-empty, stdout empty, no file created | its `rows.txt` line |
| REQ-06 c4 | Row T-REQ-06-… assigned at gate 5: with no file, `drop 1` exits 1, stderr non-empty, stdout empty, no file created | its `rows.txt` line |
| REQ-06 c5 | Row T-REQ-06-… assigned at gate 5: with no file, `add ""` exits 2, stderr non-empty, stdout empty, no file created | its `rows.txt` line |
| REQ-06 c6 | Row T-REQ-06-… assigned at gate 5: with no file, `done abc` exits 2, stderr non-empty, stdout empty, no file created | its `rows.txt` line |
| REQ-06 c7 | Row T-REQ-06-… assigned at gate 5: with no file, `frobnicate` exits 2, usage on stderr containing `add`, `list`, `done` and `drop`, stdout empty, no file created | its `rows.txt` line |
| REQ-07 c1 | **[non-root]** Row T-REQ-07-… assigned at gate 5: with `shelf.json` made unreadable by `chmod`, `list` exits 1, stderr non-empty, stdout empty. Precondition check and gap handling as REQ-03 c12 | its `rows.txt` line; if the gate runs as root, the gap recorded at gate 5 |
| REQ-07 c2 | **[non-root]** Row T-REQ-07-… assigned at gate 5: same staging, `add Dune` exits 1, stderr non-empty, stdout empty. Same precondition and gap handling | its `rows.txt` line; if root, the recorded gap |
| REQ-07 c3 | **[non-root]** Row T-REQ-07-… assigned at gate 5: same staging, `done 1` exits 1, stderr non-empty, stdout empty. Same precondition and gap handling | its `rows.txt` line; if root, the recorded gap |
| REQ-07 c4 | **[non-root]** Row T-REQ-07-… assigned at gate 5: same staging, `drop 1` exits 1, stderr non-empty, stdout empty. Same precondition and gap handling | its `rows.txt` line; if root, the recorded gap |
| REQ-07 c5 | **[non-root]** Row T-REQ-07-… assigned at gate 5: after the four commands, permission is restored by the test and the file's bytes equal what was staged. Same precondition and gap handling | its `rows.txt` line; if root, the recorded gap |
| REQ-08 c1 | **[non-root]** Row T-REQ-08-… assigned at gate 5: with book 1 staged and `shelf.json` made read-only (a second variant: its directory made read-only), `add Ulysses` exits 1, stderr non-empty, stdout empty. The row first checks that its own process cannot write there; if it can (root), the row is a gap per Q10 | its `rows.txt` line; if the gate runs as root, the gap recorded at gate 5 (Q10) |
| REQ-08 c2 | **[non-root]** Row T-REQ-08-… assigned at gate 5: same staging, `done 1` exits 1, stderr non-empty, stdout empty. Same precondition and gap handling | its `rows.txt` line; if root, the recorded gap (Q10) |
| REQ-08 c3 | **[non-root]** Row T-REQ-08-… assigned at gate 5: same staging, `drop 1` exits 1, stderr non-empty, stdout empty. Same precondition and gap handling | its `rows.txt` line; if root, the recorded gap (Q10) |
| REQ-08 c4 | **[non-root]** Row T-REQ-08-… assigned at gate 5: after each of the three commands the file's bytes and the directory listing equal what was staged, so no partial or temporary file is left. Same precondition and gap handling | its `rows.txt` line; if root, the recorded gap (Q10) |
| REQ-08 c5 | Row T-REQ-08-N4 (section 14, delta 2; no `chmod`, so it runs as root too): with a large shelf, {1 to read Dune; 2 to read Emma} followed by 400 to-read books with 40,000-character titles (about 16 MB, so that the two writes take long enough to overlap on a slow machine too), `done 1` and `done 2` are started in the same moment as two processes, forty times over, restaging between trials; in every trial `list` afterwards exits 0, a `done` that exited non-zero printed nothing on stdout and `list` still shows its book `to read`, and when one or both exited 0 `list` shows at least one of their books `read` | its `rows.txt` line |
| REQ-09 c1 | Row T-REQ-09-… assigned at gate 5: with a file that is not valid JSON, `list` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-09 c2 | Row T-REQ-09-… assigned at gate 5: same file, `add Dune` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-09 c3 | Row T-REQ-09-… assigned at gate 5: same file, `done 1` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-09 c4 | Row T-REQ-09-… assigned at gate 5: same file, `drop 1` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-09 c5 | Row T-REQ-09-… assigned at gate 5: for each of an array, a number, an object missing its books, an object missing its next id, `list` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-09 c6 | Row T-REQ-09-… assigned at gate 5: the same four wrong-shape files, `add Dune` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-09 c7 | Row T-REQ-09-… assigned at gate 5: the same four files, `done 1` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-09 c8 | Row T-REQ-09-… assigned at gate 5: the same four files, `drop 1` exits 1, stderr non-empty, stdout empty | its `rows.txt` line |
| REQ-09 c9 | Row T-REQ-09-… assigned at gate 5: a file that is not valid JSON is byte-for-byte untouched after each of the four commands | its `rows.txt` line |
| REQ-09 c10 | Row T-REQ-09-… assigned at gate 5: each of the four wrong-shape files is byte-for-byte untouched after each of the four commands | its `rows.txt` line |

**Criteria that cannot be verified on every gate machine.** REQ-07 c1 to c5, REQ-08 c1 to c4 and
REQ-03 c12 need `chmod` to remove permissions. On GitHub's hosted Linux runner the job runs as a
non-root user, so the rows can stage it and run as written. As root, `chmod` has no effect, so these
rows cannot prove anything. Q10 directs that a row that cannot run on the gate's machine is recorded
as a gap at gate 5 by the eval plan; for REQ-08 that is the user's direction, and this blueprint
applies the same treatment to REQ-07 and REQ-03 c12 as a recorded default. The evidence then is the
gap record in the eval plan, not a `pass`. The mechanism that verifies them is the row above, run by
`eval/run.sh` as a non-root user. See Open points 2.

**Wording is not verified.** Per Q14 the rows check stderr is non-empty and never its words, so the
message table in section 10 is held by the fresh reader at review, not by a row. The one exception
is D11: the usage rows for the unknown-command cases check that the four command words `add`, `list`,
`done` and `drop` appear in the usage on stderr, and nothing else about wording is checked by a row.

## 5. Security controls

shelf has no identity, no login and no network; the single role is the person at the terminal, and the
operating system's file permissions are the only authorization (REQ-07, REQ-08). Input comes from two
places: the command-line arguments and the contents of `shelf.json`.

| Requirement | Validated | Missing | Malformed | Unauthorized | Never logged or stored |
|---|---|---|---|---|---|
| REQ-01 (title) | Arguments after `add` joined with single spaces, then trimmed (JavaScript `trim()`) | No argument: exit 2, message | Empty or whitespace-only after joining: exit 2, message | Not applicable | The title is stored in `shelf.json` and echoed in the success line, nowhere else |
| REQ-02 (list) | No argument is read; extra arguments are ignored | Not applicable | Not applicable | Not applicable | Nothing stored or logged |
| REQ-03 (id) | The first argument after `done` matches `^[0-9]+$`, then is converted with `Number` | No argument: exit 2 | Not matching (`abc`, `1.5`, `-1`, `1a`, `+1`, empty): exit 2 | Not applicable | Titles only; nothing else |
| REQ-04 (id) | As REQ-03 for `drop` | As REQ-03 | As REQ-03 | Not applicable | Titles only |
| REQ-05 (command word) | The first argument must be exactly `add`, `list`, `done` or `drop`; case-sensitive | No word: exit 2, usage | Any other word: exit 2, usage (the word is echoed on the first line) | Not applicable | Nothing |
| REQ-06 (missing file) | Absence (`ENOENT`) of `shelf.json` is read as the empty shelf | Treated as empty shelf; only a successful `add` writes the file | Not applicable | Not applicable | Nothing |
| REQ-07 (unreadable) | Any read failure other than `ENOENT` is unreadable | Not applicable | Not applicable | The operating system's permission refusal is reported: exit 1, message with the error code | The file's contents are not echoed |
| REQ-08 (unwritable) | The write path (a check that the existing file is writable, then a temporary file named for the writing process in the same directory, then rename) fails as a whole | Not applicable | Not applicable | The refusal is reported: exit 1, message with the error code; the temporary file is removed | The file's contents are not echoed |
| REQ-09 (corrupt) | The JSON is parsed, then its shape is checked as section 7 says | Empty file is not valid JSON: corrupt | Invalid JSON, or wrong shape: exit 1, fixed message, file untouched | Not applicable | The file's contents are not echoed; the message carries only a fixed description of the shape fault |

Application-wide: shelf logs nothing and writes no file other than `shelf.json` (and its removed
temporary). Environment variables are never read. [recorded default]

## 6. Configuration

None. There is no setting, flag, environment variable or configuration file. The only input beyond the
arguments is the working directory, which fixes where `shelf.json` is (`./shelf.json`, resolved by the
process's current directory). Nothing is required at start. Decider: PRD clause (section 6, "The shelf
is `shelf.json` in the current directory", and "No dependencies").

## 7. Data

One store: the file `shelf.json` in the current directory. [PRD clause, section 6] A JSON document
with two fields. The names are a recorded default (the PRD leaves them to this blueprint):

| Field | Type | Meaning |
|---|---|---|
| `nextId` | integer, at least 1 | The id the next added book gets ("its next id"). Starts at 1 on a never-used shelf; only ever increases; never lowered by `drop` |
| `books` | array of book objects | "Its books" |
| `books[].id` | integer, at least 1 | The book's id |
| `books[].status` | the string `"to read"` or `"read"` | The status |
| `books[].title` | non-empty string | The trimmed title |

Example, after adding three books, dropping book 2 and marking book 3 read:

```json
{
  "nextId": 4,
  "books": [
    { "id": 1, "status": "to read", "title": "Dune" },
    { "id": 3, "status": "read", "title": "Ulysses" }
  ]
}
```

A never-used shelf, which `add` writes the first time and which the rows may stage, is
`{ "nextId": 1, "books": [] }`. Written with two-space indentation and a trailing newline. The file
holds no other field; other fields found on reading are neither checked nor preserved when the file is
rewritten: they are ignored on read and dropped on rewrite (the user, Q18 item 5, D8).

**Uniqueness and ordering.** Ids are unique because each `add` takes `nextId` and then raises it by
one, and a shelf is refused as corrupt if two books share an id or if `nextId` is not above every
`id`. The store here is a file, so the rules layer and the store's read check enforce this; there is no
constraint engine. Ids are therefore never reused (REQ-01 c6, c7) even when the shelf is emptied.
Books are appended in ascending id order, and `list` sorts by id anyway, so a hand-edited order does
not leak into the output (REQ-02 c2).

**How a wrong-shape document is detected** (in `store.mjs`, after `JSON.parse` succeeds): the shelf is
corrupt if any of these holds. The top-level value is not a plain object (an array, a number, a
string, `null`); `books` is absent or not an array; `nextId` is absent or not a safe integer of at
least 1; any element of `books` is not an object with a safe-integer `id` of at least 1, a `status`
equal to `"to read"` or `"read"`, and a non-empty string `title`; two books share an `id`; `nextId` is
not greater than every `id`. Each fault has a fixed description in the message table. [recorded
default; the PRD's examples (array, number, missing books, missing next id) are all covered] The PRD
does not ask for the checks beyond its examples (duplicate ids, `nextId` not above every id, a bad
status, an empty title); they are here because Q9 makes corrupt any valid JSON that is not the shape
shelf writes, and that covers every shape shelf never writes.

**How the file is written.** A recorded default, accepted by the user (Q18 item 1, D4): build the whole document,
check that an existing `shelf.json` is writable (`accessSync` with `W_OK`), write it to a temporary
file in the same directory, named for the writing process (`.shelf.json.<pid>.tmp`; TD-20, section
14 delta 2, the founder's decision on D-2; before delta 2 the name was the shared `.shelf.json.tmp`),
then `renameSync` it over `shelf.json`; if any step fails, remove that temporary file and report
unwritable. Why: a direct `writeFileSync` truncates the file
before writing, so a full disk or a kill mid-write leaves the reader's whole log empty or half-written
and then refused as corrupt, while the rename replaces the file whole or not at all. Rename would
otherwise replace a read-only file in a writable directory, so the explicit `W_OK` check is what keeps
REQ-08's "file cannot be written" refusal. The cost is one more step and one more thing for REQ-08 c4
to check (no leftover temporary file). The alternative (direct `writeFileSync`) is simpler and meets
every criterion; it is not chosen only for the loss described. The user accepted it (Q18 item 1, D4).

Reading is `readFileSync` of `./shelf.json`; `ENOENT` means missing (an empty document is returned and
nothing is created); any other failure means unreadable. Only `add`, `done` and `drop`, and only after
every check has passed, write.

## 8. Concurrency

The one shared object is `shelf.json`. The PRD has one role, one person, and lists serving more than
one person as a non-goal (section 3, section 7), but it does not speak to one person's two shells
acting on it at once. Decider: recorded default (the PRD's single role makes it unlikely; the cost is
a lost update when two commands write at once). What happens: there is no lock; each command reads the whole file, then
writes the whole file, so the last write wins and an earlier concurrent change can be lost. The
temporary-and-rename write keeps each write whole, so a concurrent reader sees either the old or the
new document, never a torn one. Each writer has its own temporary file, named for its process
(TD-20; section 14, delta 2, from the founder's decision on D-2), so a command's rename installs the
document that command built: a command that reports failure has changed nothing, and a command that
reports success installed its own document, which the other writer may then replace. Before delta 2
the two writers shared one temporary file name, which was not guarded; D-2 records what that did
(the failed command's document installed, the successful command's lost).

## 9. Stories and integration

Two stories, as the user's scope fixes. [scope; PRD section 7]

| Story | Content | Files it owns |
|---|---|---|
| 1 | `add` and `list`; the unknown-command path; the store with missing, unreadable, corrupt, unwritable and the write method; the error class; the boundary, its usage text and its exit-code table | Creates all three files: `app/shelf.mjs`, `app/src/shelf.mjs`, `app/src/store.mjs` |
| 2 | `done` and `drop`, and routing them in the order of checks; the unknown-id kind in the boundary's exit-code table | Edits `app/shelf.mjs` and `app/src/shelf.mjs` only; never `app/src/store.mjs` |
| 3 | The fix of D-2 (section 14, delta 2): the temporary file's name becomes per-process (TD-20) | Edits `app/src/store.mjs` only; never `app/shelf.mjs` or `app/src/shelf.mjs` |

Story 2 edits two files story 1 created; the user accepted this create-then-edit sequence as a
recorded limitation of the disjoint-scope rule (D10), and story 2's scope file names only those two
files. Story 1's scope file (`eval/stories/1.txt`) lists its three files and story 2's
(`eval/stories/2.txt`) lists its two. Story 3 is an increment in sequence, after stories 1 and 2
merged (INCREMENT.md section 3, item 5: the disjoint-scope rule is for stories built in parallel);
its scope file (`eval/stories/3.txt`) lists `app/src/store.mjs` alone.

Order: story 1, then story 2; story 2 builds on the files story 1 created. Until story 2, `done` and
`drop` are not routed and fall into the unknown-command path (the usage text already lists all four
commands). Criteria whose command is `add`, `list` or an unknown command belong to story 1, and those
whose command is `done` or `drop` to story 2. Criteria that name several commands (REQ-07 c5 and
REQ-09 c9 and c10 all four; REQ-08 c4 three) are met by story 1 for `add` and `list` and completed by story 2; the
eval plan decides how their rows split. The store is complete in story 1 so that story 2 never edits
it. Detail (rows per story, `eval/stories/<n>.expect`) belongs to the eval plan.

## 10. Decisions

| # | Decision | Decider |
|---|---|---|
| TD-1 | Node 22, command line, no dependencies, `shelf.json` in the current directory | the user (scope; PRD section 6) |
| TD-2 | ES modules `.mjs`; no `package.json` under `app/`; three files; dependency direction boundary to rules to store. No `package.json` at the root | under `app/`, the three files and the direction: the user (Q16, D2). At the root: recorded default (not covered by D2 or D5) |
| TD-3 | Conventions step with pinned ESLint and Prettier under `eval/conventions/`, own `package.json` and lockfile, installed by `eval/run.sh`, never into `app/`; ESLint enforces `max-lines`, `max-lines-per-function`, `complexity`; the forbidden-in-app check reads `eval/conventions/forbidden-in-app.txt` | the user (Q17, D3) for the pinned-tools decision. The exact versions, `singleQuote`, `printWidth`, `camelcase`, `no-warning-comments`, `no-restricted-imports`, `no-restricted-globals`, `noInlineConfig` and the layout check's content are recorded defaults (the layout check's: accepted by the user, Q18 item 2, D5) |
| TD-4 | Arguments are checked before the file is opened | the user (Q15, D1) |
| TD-5 | The wording of messages and usage is fixed here in the table below; tests check only that stderr is non-empty, except that the unknown-command rows also check the four command words appear (D11). Per D11 the rows for the unknown-command cases may check that the usage text on stderr contains `add`, `list`, `done` and `drop`; no other wording is checked. | Q14, a recorded default the user accepted; wording itself: recorded default; the user (D11) for the usage words |
| TD-6 | Field names `nextId`, `books`, `id`, `status`, `title`; status stored as the strings `"to read"` and `"read"`; two-space JSON with a trailing newline; fields shelf did not write are ignored on read and dropped on rewrite | names and format: recorded default (PRD leaves the names to the blueprint, Corrupt definition); other fields: the user (Q18 item 5, D8) |
| TD-7 | Wrong-shape detection as in section 7. The PRD does not ask for the checks beyond its examples (duplicate ids, `nextId` not above every id, a bad status, an empty title); they are here because Q9 makes corrupt any valid JSON that is not the shape shelf writes | recorded default (PRD Corrupt definition and Q9 fix the cases, not the checks) |
| TD-8 | Writes by temporary file in the same directory and rename, with an explicit writability check | recorded default, accepted by the user (Q18 item 1, D4) |
| TD-9 | All file access is synchronous (`readFileSync`, `writeFileSync`, `renameSync`, `accessSync`); the boundary sets `process.exitCode` and never calls `process.exit()` | recorded default |
| TD-10 | Exit codes: 0 success; 2 for an unknown or missing command, a missing or empty title, a missing or non-numeric id; 1 for an unknown id and for an unreadable, corrupt or unwritable file | PRD clause (section 4 Order of checks; REQ-01 to REQ-09 criteria) |
| TD-11 | A failure that is none of the above (a defect in shelf, an unexpected system error) exits 1, prints `shelf: unexpected error` and the error's stack on stderr once at the boundary, nothing on stdout, and never changes the file. The PRD does not ask for it; it is here because a defect must not be silent | recorded default (the PRD is silent) |
| TD-12 | Whitespace in "empty title" and in trimming is JavaScript's `String.prototype.trim` | recorded default |
| TD-13 | `done` always rewrites the file, including on a book already read | recorded default (REQ-03 c3 fixes the printed line and the status, not the write) |
| TD-14 | Id lookup converts the digit string with `Number`; a value that matches no stored id, including one too large to be exact, is an unknown id | recorded default (PRD Unknown id definition) |
| TD-15 | The tests invoke `node app/shelf.mjs <args>` as a child process with the working directory set to a fresh temporary directory, and never import `app/`. The reader runs `node app/shelf.mjs <args>` or an alias; there is no launcher and no manifest | recorded default for the tests; the reader's invocation: the user (Q18 item 4, D7) |
| TD-16 | Test framework for `eval/`: `node --test`, built into Node 22, with its TAP reporter (`--test-reporter=tap`) converted by `eval/run.sh` into `eval/report/rows.txt`; a row's test name is its row id; a deferred row is left out with `--test-skip-pattern` as RUNTIMES.md describes; `eval/runtime` holds the single line `node 22` | recorded default |
| TD-17 | No lock on `shelf.json`; last write wins. Unchanged by delta 2: the lost update stays; what delta 2 removes is a failed command's document reaching the disk (section 8) | recorded default (the PRD's single role makes it unlikely; the cost is a lost update when two commands write at once) |
| TD-18 | Complexity limit 10 | recorded default (PRACTICES.md names no figure) |
| TD-19 | Row-gap handling for the permission rows as section 4 says | the user for REQ-08 (Q10); recorded default for REQ-07 and REQ-03 c12 |
| TD-20 | The temporary file of the write path (TD-8) is named for the writing process, so two commands at once never write to or rename each other's temporary file; its name is `.shelf.json.<pid>.tmp`, with the process id read from `node:process` (an import, not the `process` global the store's lint rule bars) | a per-process name: the founder (D-2, 2026-10-28, ajpasco: "fix now, option (b), a per-process temporary file name"). The exact form `.shelf.json.<pid>.tmp` and the `node:process` import: a default proposed by the packet drafter, not the founder's decision |

**Exit codes and messages**, one line per case (stdout is empty in every case but success). The prefix
`shelf: ` begins every message line. `<…>` is filled by shelf. Usage text, printed in full after the
first line where marked:

```
usage: shelf <command>
  add <title...>   add a book
  list             list the books
  done <id>        mark a book read
  drop <id>        remove a book
```

| Case | Kind | Exit | stderr |
|---|---|---|---|
| Success | none | 0 | nothing |
| No command word | `usage` | 2 | usage text only |
| Unknown command word (`frobnicate`, `search`, `rate`) | `usage` | 2 | `shelf: unknown command: <word>`, then usage text |
| `add` with no title argument | `argument` | 2 | `shelf: add needs a title` |
| `add` with an empty or whitespace-only title | `argument` | 2 | `shelf: the title is empty` |
| `done` or `drop` with no id | `argument` | 2 | `shelf: <command> needs an id` |
| `done` or `drop` with a non-numeric id (including the empty string) | `argument` | 2 | `shelf: not a numeric id: <argument>` |
| Unknown id (`99`, `0`, `007` with no book 7, or no file) | `unknown-id` | 1 | `shelf: no book with id <number>` |
| File unreadable | `unreadable` | 1 | `shelf: cannot read shelf.json (<error code>)` |
| File not valid JSON | `corrupt` | 1 | `shelf: shelf.json is not valid JSON; fix or remove it` |
| File valid JSON, wrong shape | `corrupt` | 1 | `shelf: shelf.json is not a shelf (<fault>); fix or remove it` |
| File cannot be written | `unwritable` | 1 | `shelf: cannot write shelf.json (<error code>)` |
| Unclassified failure | none | 1 | `shelf: unexpected error`, then the stack |

`<fault>` is one fixed phrase: `not an object`, `books is not a list`, `nextId is not a positive
integer`, `a book is malformed`, `two books share an id`, `nextId is not above every id`.

Success lines on stdout, one per command, each followed by a newline: `added <id> <title>`,
`done <id> <title>`, `dropped <id> <title>`, and for `list` one `<id> <status> <title>` line per book
(PRD, REQ-01 to REQ-04). The id printed for `done 007` is `7`.

## 11. Open points

1. **Pinned versions chosen without checking a registry; verified at gate 7.** ESLint `9.39.1`,
   `@eslint/js` `9.39.1`, Prettier `3.6.2`. These are the versions this blueprint believes current for
   ESLint 9 and Prettier 3; no registry was consulted. At gate 7 the lockfile is generated with a
   registry, the versions are confirmed or replaced, the exact ESLint invocation (the base path
   when `--config` is given) is proved by running it, and the guard of section 13 step 0 is proved by
   running the suite against the empty tree. Blocks: `eval/conventions/package-lock.json`
   and the conventions step. Also undecided: the conventions step's `npm ci` needs network access to
   the npm registry on the gate (GitHub's hosted runner has it); a gate with no registry access
   cannot run the conventions step. Blocks: the conventions step on such a gate.
2. **Permission rows cannot run as root.** REQ-07 c1 to c5, REQ-08 c1 to c4 and REQ-03 c12 stage
   their state with `chmod`. They run on GitHub's hosted Linux runner (non-root) and cannot run as
   root; if the gate runs as root they are a gap, to be recorded by the eval plan at gate 5 (Q10).
   Undecided: how a gap shows in a run, since `rows.txt` and `eval/deferred.txt` (which needs a
   defect id from the founder) have no entry for "cannot run". Blocks: the evidence of those 10 rows.
3. Closed by D6: see Accepted limitations below.
4. Closed by D7: see Accepted limitations below.
5. Closed by D8: other fields in `shelf.json` are ignored on read and dropped on rewrite (TD-6,
   section 7).
6. Closed by D5.
7. Closed: decided as a recorded default (TD-18, Conventions Limits).

### Accepted limitations

- **Titles with a newline or other control characters** (D6, Q18 item 3). The PRD fixes the printed
  line but is silent on a title that holds a newline or an escape sequence. Nothing refuses or
  sanitises such a title, and `list` output may then span lines. No PRD change was requested.
- **No `shelf` command on the path** (D7, Q18 item 4). With no `package.json` there is no `bin` entry
  and this blueprint provides no installer or launcher; the reader runs `node app/shelf.mjs <args>`
  or makes their own alias.

## 12. Production-readiness review

One line per concern of `PRACTICES.md` section A. "Scope" below is the user's Gate 1 idea:
command line, one person, own machine, no web app, no server, no database.

### Security

| Concern | Answer |
|---|---|
| Identity and authorization | Excluded: shelf has no identity; the one role is whoever runs it, and file permissions are the operating system's. Excluded by PRD clause (section 3, "one role"). Brought back by a second role or a shared shelf. |
| Validation of input | In scope: the rules layer validates the arguments it is handed, before asking the store for the file (D1), and the file is validated once on read in the store; that the rules trust what the store returned is a recorded default. This departs from PRACTICES.md's "at the boundary" recommendation because the boundary here only renders; the placement is a recorded default. Decided by the user (Q15) and a recorded default the user accepted (Q9). |
| Secrets | Excluded: shelf reads and holds no secret and no environment variable. Excluded by recorded default (scope silent); brought back by any credential. The secret scan is declined: recorded default, accepted by the user (Q18 item 6, D9). |
| Dependencies | In scope: none at runtime (the user, scope). That `app/` has no `package.json` or lockfile is the user's (D2). That there is none at the root is a recorded default (not covered by D2 or D5). That the conventions step refuses any import that is not `node:` or relative is a recorded default (the user chose the tools, D3, not this rule). The audit of known vulnerabilities is declined: the application has no dependencies (the user, scope); the conventions tooling under `eval/conventions/` does have a dependency tree, which is not the application and is not audited (recorded default, accepted by the user, Q18 item 6, D9). |
| Transport | Excluded: nothing leaves the machine; no TLS. Excluded: recorded default derived from the scope ("not a web app, a server or a database"); brought back by any network traffic. |
| Cross-origin access and security headers | Excluded: no HTTP. A command-line tool declines the client's in one sentence (see Conventions, The client). Excluded: recorded default derived from the scope ("not a web app, a server or a database"); brought back by an HTTP interface. |
| Containers | Excluded: no image, no `Dockerfile`; runs directly under Node 22. Recorded default; brought back by a decision to ship an image. |
| What is never logged or stored | In scope: shelf logs nothing; stores only titles, ids and statuses in `shelf.json`; never echoes the file's contents in a message; reads no environment (section 5). Recorded default. |

### Reliability

| Concern | Answer |
|---|---|
| Start-up | In scope in the form that fits: nothing is read at import time; no configuration exists to fail; the file is read once, per command, after the arguments pass. Recorded default. |
| Shutdown | In scope in the form that fits: all work is synchronous and ends with the process; the exit code is set on `process.exitCode`, so stdout is flushed. A kill mid-write leaves the old file whole (temporary and rename). Recorded default. |
| Health | Excluded: no platform polls a command-line tool. Excluded: recorded default derived from the scope ("not a web app, a server or a database"); brought back by a platform that polls shelf. |
| Timeouts | Excluded: no outbound call. Excluded: recorded default derived from the scope ("not a web app, a server or a database"); brought back by any outbound call. |
| Shared objects | In scope: `shelf.json` is the one; decided in section 8: no lock, last write wins (recorded default). The recommended enforcement in the store is declined for a file: recorded default, accepted by the user (Q18 item 6, D9). Delta 2 (D-2, the founder): each writer's temporary file is its own (TD-20); "no lock, last write wins" stands. |
| Retries and idempotency | In scope: `add` is deliberately not idempotent, a repeat creates a second book (user, Q8); `done` repeated is safe and succeeds again (user, Q3); `drop` repeated is refused as an unknown id (PRD REQ-04 c6); `list` is read-only (PRD REQ-02 c5). |
| Schema evolution | Excluded: the file has one shape and no version field; a changed shape would make old files corrupt. Excluded by recorded default (scope silent); brought back by a second shape of the file. |
| Backups and retention | Excluded: none. `shelf.json` is the reader's file and copies of it are theirs to make; no figure is invented. Recorded default; brought back by a requirement to recover a lost shelf. |

### Observability

| Concern | Answer |
|---|---|
| Logs | Excluded: shelf writes no log; its output is the command's stdout and stderr. Recorded default, accepted by the user (Q18 item 6, D9); brought back by a requirement for an audit trail. |
| Request identity | Excluded: no requests. Excluded: recorded default derived from the scope ("not a web app, a server or a database"); brought back by a server or any request. |
| Errors | In scope: one error class and kind per failure, raised below the boundary and mapped to a message and exit code once at the boundary; the unclassified failure prints its stack once; none is swallowed (section 10). Recorded default. |
| Metrics and alerting | Excluded: nothing runs long enough to measure. Excluded: recorded default derived from the scope ("not a web app, a server or a database"); brought back by a long-running process. |

### Delivery and data

| Concern | Answer |
|---|---|
| Reproducible build | In scope in the form that fits: there is no build; the conventions tools are pinned by an exact version and a committed lockfile under `eval/conventions/` (user, D3), installed by `npm ci`. |
| Configuration | In scope as "none": section 6 lists no setting; no example file is needed (PRD clause). Settings loading is declined: recorded default, accepted by the user (Q18 item 6, D9). |
| Running locally | In scope: `node app/shelf.mjs <args>` from any directory; nothing to start (recorded default). No README is written: recorded default, accepted by the user (Q18 item 6, D9). |
| Seed data | Excluded: there is no seed; a never-used shelf is no file at all or `{ "nextId": 1, "books": [] }`. Recorded default. |
| Invariants | In scope: unique ids and never-reused ids are held by `nextId` and the read check (section 7), by the rules and the store, since a file has no constraints. Recorded default; the criteria are the PRD's. |
| Time and identifiers | Excluded for time: no dates (user, scope). Identifiers are generated by the application from `nextId`, never taken from the reader. Recorded default. |

### Concerns the stack brings beyond section A

| Concern | Answer |
|---|---|
| Crash and disk-full safety of the one file | In scope: temporary file and rename (section 7). Recorded default, accepted by the user (Q18 item 1, D4). |
| File created by a first `add` | In scope: created with Node's default mode under the reader's umask; nothing sets a mode. Recorded default. |
| Exit-code contract | In scope: section 10 fixes 0, 1 and 2 per case. PRD clause (section 4 Order of checks; REQ-01 to REQ-09 criteria). |
| Platform support | In scope: Node 22 on the reader's machine (user, scope); no other operating-system claim is made, and the permission rows assume POSIX permission bits. Open point 2. |
| Terminal output of control characters in a title | Accepted limitation: nothing refuses or sanitises such a title (the user, D6; section 11). |
| Output write failure (stdout closed) | Excluded: not handled beyond Node's default; recorded default. |
| Putting `shelf` on the path | Accepted limitation: the reader runs `node app/shelf.mjs <args>` or an alias (the user, D7; section 11). |

## 13. Conventions

Made concrete for plain JavaScript on Node 22. Every builder is bound to this section; where it is
silent, follow the existing code and introduce no convention of your own.

### Layout

```
.
├── app/                     the application; exactly the three files below, nothing else (D2)
│   ├── shelf.mjs            boundary: argv in, stdout/stderr and exit code out; no rules, no file access
│   └── src/                 the inner layers; never imports upward
│       ├── shelf.mjs        rules: add, list, done, drop, order of checks; no I/O, no process, no fs
│       └── store.mjs        store: every read and write of shelf.json, its checks and its errors; knows no command
├── docs/                    PRD, mockup, this blueprint and the preparation records; not application code
└── eval/                    the acceptance tests and the runner; the builder never changes it
    ├── conventions/         pinned ESLint and Prettier, their package.json, lockfile and configuration, the forbidden-in-app list, the two check scripts (forbidden-in-app.sh, layout-check.sh), and commits.md (the commit rule, handed to the fresh reader); eval/conventions/node_modules/ is created by the install and ignored by git through `eval/.gitignore`, which holds `report/` and `conventions/node_modules/`
    ├── report/              rows.txt written by each run; ignored by git
    ├── stories/             <n>.txt (scope file: the files the story may touch), <n>.md (brief), <n>.expect (expected failures), one set per story, each story's set shipped with its packet
    ├── run.sh, runtime      the gate's entry point and the one line `node 22`
    └── …                    the acceptance tests and the TAP-to-rows converter (named by the eval plan)
```

### Limits

| Limit | Value | Linter rule (ESLint, flat config) |
|---|---|---|
| File length | 300 lines | `max-lines` with `max: 300` |
| Function length | 50 lines | `max-lines-per-function` with `max: 50` |
| Complexity | 10 | `complexity` with `max: 10` |

### The conventions step

Run by `eval/run.sh` from the repository root against `app/` only, before any row, using the tools
below with their configuration named on the command line. It is not a row. An absent or empty
`app/` passes, by the guard in step 0. A failing check fails the run before `rows.txt` is written.
The tools it runs are:

0. **The guard:** `eval/run.sh` first checks whether `app/` exists and holds at least one `.mjs`
   file. If it does not, it prints one line saying the conventions step has nothing to check, skips
   steps 1 to 5 (the install, the tools and the two checks), and the step passes (`PRACTICES.md`
   section C rule 3). Why: git keeps no empty directory, so `app/` may be absent on main before
   story 1, or hold no `.mjs` file, and ESLint, Prettier and `grep` may exit non-zero with nothing to
   check. Gate 7 proves the guard by running the suite against the empty tree. Decider: recorded
   default.
1. **Install:** `npm ci --prefix eval/conventions` (the only install; `app/` gets none). `npm` is
   the one bundled with Node 22 on the gate's image, unpinned beyond that. The install needs network
   access to the npm registry on the gate, which GitHub's hosted runner has; a gate with no registry
   access cannot run the conventions step, and that is listed under Open points 1.
2. **ESLint 9.39.1** with `@eslint/js` 9.39.1: `eslint --config eval/conventions/eslint.config.mjs app`.
   The configuration sets `linterOptions.noInlineConfig: true`, so a disable comment in `app/` turns
   nothing off.
3. **Prettier 3.6.2**: `prettier --check --config eval/conventions/prettierrc.json --ignore-path
   eval/conventions/prettierignore --no-editorconfig app`.
4. **The forbidden-in-app check:** the file `eval/conventions/forbidden-in-app.sh` holds the `grep`
   invocation `grep -rEnf eval/conventions/forbidden-in-app.txt app`; any match fails. The list holds
   patterns for the runner, reporter and report path the tests use, among them `eval/`, `rows\.txt`,
   `node:test`, `--test-reporter`, `deferred\.txt`, `\.expect` and `T-REQ-`. It runs with the POSIX
   `sh` and the `grep` of the gate's `ubuntu-latest` image: unpinned system tools, stated as such.
5. **The layout check:** the file `eval/conventions/layout-check.sh` fails the step if any
   `package.json`, `package-lock.json` or `node_modules` exists under `app/` or at the root, or if
   `app/` holds any file other than the three of D2. It runs with the POSIX `sh` of the gate's
   `ubuntu-latest` image: an unpinned system tool, stated as such. Decider: no
   `package.json` under `app/` and exactly the three files, the user (D2); no `package.json` at the
   root: recorded default (not covered by D2 or D5); the check failing on any other file under
   `app/`: the user (D5).

### Practices of `PRACTICES.md` section B

| Practice | Concrete form: tool, pinned version, configuration file, rule |
|---|---|
| Layering | ESLint 9.39.1, `eval/conventions/eslint.config.mjs`: `no-restricted-imports` per file. `app/shelf.mjs` may import only `./src/shelf.mjs`; `app/src/shelf.mjs` only `./store.mjs`; `app/src/store.mjs` only `node:` modules. Code in `app/src/shelf.mjs` and `store.mjs` uses no `process` or `console` (`no-restricted-globals`); only `store.mjs` imports `node:fs`; the rules and boundary never do. The module that decides never performs the I/O, and the module that performs never decides. Decider: the three files and the one-way direction, the user (D2); the specific ESLint rules above, recorded default. |
| Layout | The tree above; the layer-per-file rule is held by the layout check and the import rules above. One concern per module; `app/` never gains a utilities file because D2 fixes three. Plain functions, no classes except the one error class. A helper that knows a book belongs in the rules. |
| Limits on length and complexity | ESLint rules `max-lines` (300), `max-lines-per-function` (50) and `complexity` (10), in `eval/conventions/eslint.config.mjs`. The enforcement by these three ESLint rules is the user's (D3); the figures 300, 50 and 10 are recorded defaults (TD-18, and PRACTICES.md's recommendations for 300 and 50). |
| Errors | One class `ShelfError` with a `kind` (`usage`, `argument`, `unknown-id`, `unreadable`, `corrupt`, `unwritable`), thrown below the boundary and mapped once at the boundary to a message and exit code; no empty `catch`, no swallowed error, enforced by `no-empty` from `@eslint/js` recommended and `no-unsafe-finally`; an error is never turned into a default value except the deliberate `ENOENT` means empty shelf. |
| Logging | Declined in one sentence: shelf writes no log, only its command output and its error message (section 12). Recorded default, accepted by the user (Q18 item 6, D9). |
| Configuration | Declined in one sentence: there is no setting to load (section 6); `no-restricted-globals` already keeps `process` out of the rules and store, and the store reads no environment. Recorded default, accepted by the user (Q18 item 6, D9). |
| Dependencies | Declined in the usual sense and made stricter: none exist (user, scope). `no-restricted-imports` with a regular expression refuses any import that is neither `node:` nor relative; the layout check refuses a `package.json`. A new dependency would need a blueprint change. |
| Types | Declined in one sentence: the stack is untyped JavaScript with no build and no dependency (D2, D3 name only ESLint and Prettier), and a type checker would be a tool the user did not choose; `eslint` with `@eslint/js` recommended is the only static check. Recorded default, accepted by the user (Q18 item 6, D9). |
| Formatting and lint | Prettier 3.6.2 (`eval/conventions/prettierrc.json`: `singleQuote: true`, `printWidth: 100`) and ESLint 9.39.1 (`eval/conventions/eslint.config.mjs`, `@eslint/js` recommended plus the rules above), pinned in `eval/conventions/package.json` and `package-lock.json`; the code is formatted before it is committed and the step checks it. A suppression is a departure: inline directives are disabled, and a builder never edits `eval/`. Decider: pinned ESLint and Prettier, the user (D3); `singleQuote`, `printWidth`, the ESLint rules named and `noInlineConfig`, recorded default. |
| The builder's own tests | Declined in one sentence: D2 fixes `app/` at three files, so a builder commits no test file under `app/`; a run it makes by hand is not committed. Decider: recorded default, accepted by the user (Q18 item 2, D5; open point 6 closed by D5). |
| Naming | ESLint `camelcase`; files are named for their layer (`shelf.mjs`, `store.mjs`); functions and kinds use the PRD's words (`add`, `list`, `done`, `drop`, `book`, `title`, `id`, `status`, `shelf`). |
| Comments | ESLint `no-warning-comments` with terms `todo` and `fixme`; comments say why, never what; commented-out code is a departure found by the fresh reader (no tool detects it). |
| Commits | Tool: `git`, the version on the builder's machine; none is pinned because no check runs on it. Configuration: `eval/conventions/commits.md`, a short file holding the rule. Rule: one story per branch; the message's first line says what changed and the body why, in plain English. Held by the fresh reader, which is handed `eval/conventions/commits.md` with the diff and reads the commit messages against it (no tool applies to prose). |
| The client | Declined in one sentence: a command-line tool has no browser client, so there is no bundle, label or console rule to apply. |

The sections of `PRACTICES.md` C that this project does not run: **types** (declined above),
**dependency audit** (the application has no dependencies, the user, scope; the conventions tooling under `eval/conventions/` has a dependency tree that is not the application and is not audited), **secret scan** (`gitleaks` is not among the tools the user
chose in D3; shelf holds no secret), **container lint** (no `Dockerfile`). The declines of types,
dependency audit and secret scan are each a recorded default, accepted by the user (Q18 item 6, D9).

## 14. Increment deltas

Deltas made after the first build landed (INCREMENT.md section 3, item 2). Each names the layer the
change lands in, the lines of the pinned contract that change, the register rows for every new or
changed criterion, every technical choice the build needs, and who decided each.

### Delta 1: story 2, done and drop (2026-10-28)

The founder's decision, in their words: "story 2 of the plan: done and drop, as docs/eval-plan.md
and docs/PRD.md already specify" (PRD section 10, amendment 1). No product question was asked.

- **Layer.** Rules (`app/src/shelf.mjs`): `done`, `drop`, the id check, and their routing in the
  order of checks; section 3 already places REQ-03 and REQ-04 there. Boundary (`app/shelf.mjs`):
  the `unknown-id` kind enters its exit-code table at exit 1, as section 10 fixes. Store
  (`app/src/store.mjs`): unchanged and never edited by story 2 (section 9).
- **Pinned contract.** No line of section 10 changes. The success lines `done <id> <title>` and
  `dropped <id> <title>`, the messages for a missing id, a non-numeric id and an unknown id, the
  exit codes 0, 1 and 2, and the usage text naming all four commands are already fixed there, and
  story 1 shipped the usage text.
- **Verification register.** No criterion is new or changed, so no register row is added or
  changed (80 rows). The rows of REQ-03 c1 to c14, REQ-04 c1 to c14, REQ-06 c3, c4 and c6, REQ-07
  c3, c4 and c5 (`done`, `drop`), REQ-08 c2, c3 and c4 (`done`, `drop`) and REQ-09 c3, c4, c7, c8,
  c9 and c10 (`done`, `drop`) are the ones the eval plan assigned at gate 5, now written as code in
  `eval/tests/story-2.test.mjs` (eval plan section 12, delta 1). Their evidence is unchanged: each
  row's `rows.txt` line.
- **Technical choices the build needs, and who decided.** Every one is already recorded: the
  order of checks, TD-4 (the user, Q15); the exit codes, TD-10 (PRD clause); `done` always
  rewriting the file, TD-13 (recorded default); id lookup converting the digit string with
  `Number`, TD-14 (recorded default); the two files story 2 edits and the create-then-edit
  sequence, section 9 (the user, D10). This delta adds no decision.
- **Conventions and production readiness.** No convention is needed that section 13 does not
  state, so the conventions step gains and changes no tool; no line of section 12 changes.

### Delta 2: defect D-2, two commands at once (2026-10-28)

The founder's decision, in their words (2026-10-28, login ajpasco): "D-2: fix now, option (b), a
per-process temporary file name." The record is `docs/defects/D-2.md`; the PRD carries the decision
as REQ-08 c5 (PRD section 10, amendment 2).

- **Layer.** Store (`app/src/store.mjs`), the only file story 3 edits (section 9): the temporary
  file of the write path is named for the writing process (TD-20). Rules and boundary: unchanged.
- **Pinned contract.** No line of section 10's message table, exit codes, usage or success lines
  changes. Section 7, "How the file is written", changes one fact: the temporary file's name is
  `.shelf.json.<pid>.tmp` instead of the shared `.shelf.json.tmp`. Section 8 says what that
  changes and what it keeps. Section 12, Reliability, "Shared objects" keeps "no lock, last write
  wins".
- **Verification register.** One row added for the one new criterion, REQ-08 c5: T-REQ-08-N4,
  the register row in section 4 (81 rows). Its mechanism is two `done` processes started in the
  same moment on a large shelf (about 16 MB, so that their writes overlap on GitHub's runner as
  well as on a laptop), forty trials, observed through the exit codes, stdout and `list`; its
  evidence is its `rows.txt` line. No existing register row changes.
- **Technical choices the build needs, and who decided.** A per-process temporary file name:
  the founder (D-2, option (b)). The exact form `.shelf.json.<pid>.tmp`, and reading the id from
  `node:process` as an import so the store's `no-restricted-globals` rule on `process` is kept: a
  default proposed by the packet drafter (TD-20), open to the founder's change. TD-8 (temporary
  file and rename) and TD-17 (no lock, last write wins) stand.
- **Conventions and production readiness.** No convention is needed that section 13 does not
  state: the store still imports only `node:` modules, and the conventions step gains and changes
  no tool. Section 12 changes one line, Reliability "Shared objects", to name delta 2; the decision
  there stands.

## Change log

- **Revision 1:** first draft of the blueprint of PRD revision 5 and mockup revision 4.
- **Revision 2:** from the user's Q18 and D4 to D9 (write method, strict three-file `app/` and no
  builder tests, the two accepted limitations, other fields in `shelf.json`, the declined practices),
  and from the gate 4 checker's findings B-01, A-02, A-03, A-04 and A-05 (named files for the commit,
  layout and forbidden-in-app checks; the deciders of concurrency, TD-3, TD-5, section 12 and the
  scope-derived exclusions relabelled; TD-11 and the extra corrupt checks labelled as defaults).
- **Revision 3:** from the second gate 4 check's findings B-01 and A-01 to A-08. B-01: the commit
  convention names `eval/conventions/commits.md`, added to the layout tree. A-01: no `package.json`
  under `app/` is the user's (D2), none at the root a recorded default accepted with the layout check
  (Q18 item 2, D5), in every mention. A-02: the Layering and Formatting rows separate the decision
  (D2, D3) from the recorded-default rules. A-03: exit-code contract decider is the PRD clause only.
  A-04: input validation is in the rules layer, a recorded default departing from PRACTICES.md. A-05:
  `npm` version and registry access stated, listed under Open points 1. A-07: the dependency-audit
  decline gives the right reason. A-08: Open point 7 closed. A-06 stays as Open point 2, unchanged.
  The register is unchanged.
- **Revision 4:** decider of the limit figures corrected to recorded default (drafter's own note at
  revision 3).
- **Revision 5:** from the user's D10 (story 2 edits the two files story 1 created, recorded as a
  limitation of the disjoint-scope rule; section 9) and D11 (the unknown-command usage rows may check
  the four command words; section 4 and TD-5). The register is unchanged.
- **Revision 6:** sweep for every phrasing of the Q14 rule after D11; register rows REQ-05 c1–c3, c5
  and REQ-06 c7 carry the four-word check.
- **Revision 7:** header names PRD revision 7 and mockup revision 5; no other change (G5-2-A-03).
- **Revision 8:** from the gate 6 planning review's R6-001, R6-005 and R6-006. R6-001: the
  conventions step gains a guard as step 0 (an absent `app/`, or one with no `.mjs` file, passes
  with one printed line; recorded default), and gate 7 proves it, added to Open point 1. R6-005: the
  layout tree's `stories/` line names the scope file, brief and expected-failures file of each story
  shipped with its packet, the `conventions/` line records `node_modules/` as installed and
  git-ignored, and section 9 states what each story's scope file lists. R6-006 (c): section 9 says
  REQ-08 c4 names three commands, not four. The register is unchanged (80 rows).
- **Revision 9:** from the second gate 6 review's R62-002, R62-003 and R62-005. R62-002: the
  `conventions/` line of the layout tree says `eval/conventions/node_modules/` is ignored through
  `eval/.gitignore`, which holds `report/` and `conventions/node_modules/`, not the root
  `.gitignore`, so the freeze pull request touches nothing outside `docs/` and `eval/`. R62-003: the
  header names PRD revision 8 and mockup revision 6. R62-005: no `package.json` at the root is a
  recorded default not covered by D2 or D5, in TD-2, section 12 Dependencies and section 13 step 5.
  The register is unchanged (80 rows).
- **Revision 10:** increment delta 1 (section 14): story 2, done and drop, from the founder's
  decision of 2026-10-28; the header names PRD revision 9. No decision, convention or contract
  line changed. The register is unchanged (80 rows).
- **Revision 11:** increment delta 2 (section 14): defect D-2, from the founder's decision of
  2026-10-28; the header names PRD revision 10. TD-20 added (per-process temporary file name);
  section 7's write method, section 8, section 9 (story 3) and section 12's "Shared objects" line
  changed to match; TD-17 carries a note. The register gains one row, REQ-08 c5 (81 rows).
