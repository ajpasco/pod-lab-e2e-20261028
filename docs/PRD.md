# PRD: shelf

Revision 12.

Source tags in brackets: "scope" is the confirmed Gate 1 idea; Q1 to Q19 are the recorded answers
in `docs/PREPARATION-STATE.md`; D-numbers without a hyphen (D11) are the decisions recorded there.
Q5, Q9, Q10 and Q14 are accepted defaults; Q16 and Q17 are technical choices the user made between
stated options; Q18 is partly defaults the user accepted; the rest are the user's product answers.
A tag with a hyphen, `D-<n>`, is a defect record, `docs/defects/D-<n>.md`, whose founder's decision
the criterion carries (section 10). This PRD cites only the scope, Q1 to Q15, Q19, D11, D-2 and D-3.

## 1. Problem statement

One person who reads books wants a tiny reading log, on their own machine, of which books they mean
to read and have read. [scope]

## 2. The product

shelf is a tiny Node.js command-line reading log for one person on their own machine, with no
dependencies. It keeps books in `shelf.json` in the current directory. It has four commands:
`shelf add`, `shelf list`, `shelf done` and `shelf drop`. [scope]

## 3. Users and roles

One role: **the reader**, the single person running shelf on their own machine. [scope]

- May: add a book, list the books, mark a book read, drop a book. [scope]
- May not: search or rate books. `shelf search` and `shelf rate` are refused as unknown commands
  (REQ-05 criterion 3). Dates, a web app, a server and a database are non-goals (section 7), not
  role prohibitions. [scope]
- There is no other role. [scope]

## 4. Definitions

- **Book**: one entry on the shelf, with an id, a status and a title.
- **Shelf**: the set of all books held in `shelf.json` in the directory the command is run from.
- **Id**: the number shelf gives a book when it is added. The first book added to an empty,
  never-used shelf gets id 1, and each later book gets the next number. [scope, Q2]
- **Status**: either "to read" or "read". A newly added book is "to read". [scope]
- **Title**: the text of a book. For `add`, the arguments after `add` joined with single spaces,
  then trimmed of leading and trailing whitespace; interior spaces are kept as given. [Q4, Q12]
- **Empty title**: no title argument at all, or a title that is empty or only whitespace once
  joined. [scope, Q4]
- **Numeric id**: a string of decimal digits only, such as `1`, `12` or `007`. `1.5`, `-1`, `1a`,
  `+1` and the empty string are non-numeric. A numeric id denotes the number it spells, so `007`
  denotes id 7. [Q5]
- **Missing id**: no id argument after `done` or `drop`. [scope]
- **Unknown id**: a numeric id with no matching book, such as `0`, or `007` when there is no
  book 7. [scope, Q5]
- **Missing shelf file**: there is no `shelf.json` in the current directory. [Q1]
- **Unreadable shelf file**: `shelf.json` exists but cannot be read. [scope]
- **Corrupt shelf file**: `shelf.json` is not valid JSON, or is valid JSON that is not what shelf
  itself writes (for example an array, a number, or an object missing its books or its next id).
  "Its books" and "its next id" name what the file records, as Q9 does; the field names and the
  file's exact shape are the blueprint's decision. [scope, Q9]
- **Unwritable shelf file**: shelf needs to write `shelf.json` and cannot. [Q10]
- **Untouched**: the file is byte-for-byte what it was before the command ran. When the file was
  absent before the command, untouched means it is still absent. [scope, Q13]
- **Failed command**: a command that exits with a non-zero code. Only a successful `add` creates
  `shelf.json`; a failed command never creates or changes it, and leaves the disk as it was. [Q13]
- **Usage**: a stderr text that lists the four commands. [scope]
- **Order of checks**: shelf checks the command word, then the title (for `add`) or the id (for
  `done` and `drop`), before it reads `shelf.json`. An argument error (an unknown command word, an
  empty or missing title, a missing or non-numeric id; exit 2) therefore takes precedence over a
  file error (an unreadable or corrupt shelf file; exit 1), whatever the file holds. An unknown id
  needs the file to be known, so it is reported only when the file was read: with a corrupt or
  unreadable file, a numeric id exits 1 as a file error. The criteria sample this rule; the rule
  holds for every combination. [Q15]
- **Stdout closes early**: the reader of shelf's output stops reading before shelf has printed
  everything, so the rest cannot be written: for example `shelf list | head -1` or
  `shelf list | true` with a long list. [D-3]

## 5. Functional requirements

### REQ-01: Add a book

**User:** the reader. [scope]

**Flow**
1. The reader runs `shelf add` followed by a title.
2. shelf adds the book as "to read" with the next id and prints one line.

**Acceptance**
1. On a never-used shelf (no `shelf.json`, or one that has never held a book), `shelf add Dune` prints exactly `added 1 Dune` and exits 0. [scope]
2. After that, `shelf add Emma` prints exactly `added 2 Emma` and exits 0. [scope]
3. `shelf add Dune Messiah` (several arguments) prints exactly `added <id> Dune Messiah`: the
   arguments joined with single spaces. [Q4]
4. A book just added shows as "to read" in `shelf list`. [scope]
5. Adding a title already on the shelf creates a second book with a different id; no duplicate
   check refuses it. [Q8]
6. Ids are never reused: with books 1, 2 and 3, after `shelf drop 3`, `shelf add X` prints
   `added 4 X`. [Q2]
7. Ids are never reused after the shelf has been emptied: after every book is dropped, the next
   add gets an id higher than any id used before. [Q2]
8. When there is no `shelf.json`, `shelf add` creates it in the current directory and exits 0.
   [scope, Q1, Q13]
9. Missing title: `shelf add` with no further argument exits 2, puts a message on stderr, prints
   nothing on stdout, and adds no book. [scope, Q11]
10. Empty title: `shelf add ""` exits 2, puts a message on stderr, prints nothing on stdout, and
    adds no book. [scope, Q4, Q11]
11. Whitespace-only title: `shelf add "   "` exits 2, puts a message on stderr, prints nothing on
    stdout, and adds no book. [Q4, Q11]
12. Surrounding spaces are trimmed: `shelf add "  Dune "` stores the title `Dune` and prints exactly
    `added <id> Dune`. [Q12]
13. Argument errors win over file errors: `shelf add ""` while `shelf.json` is corrupt exits 2 (not
    1), puts a message on stderr, prints nothing on stdout, and leaves `shelf.json` untouched.
    [Q15]
14. Argument errors win over file errors: `shelf add` (missing title) while `shelf.json` is
    corrupt exits 2, puts a message on stderr, prints nothing on stdout, and leaves `shelf.json`
    untouched. [Q15, Q11]

### REQ-02: List the books

**User:** the reader. [scope]

**Flow**
1. The reader runs `shelf list`.
2. shelf prints one line per book, in id order.

**Acceptance**
1. Each book is printed as one line `<id> <status> <title>`, for example `1 to read Dune` or
   `2 read Emma`. [scope]
2. Lines appear in ascending id order, whatever order the books were added or changed in. [scope]
3. With no books, `shelf list` prints nothing on stdout and exits 0. [scope]
4. `shelf list` exits 0 when it lists books. [scope]
5. `shelf list` never changes `shelf.json`. [scope, Q1]
6. In a directory with a different `shelf.json`, `shelf list` shows the books of that file.
   [scope]
7. Extra arguments are ignored: `shelf list x` prints and exits as `shelf list` does. [Q7]
8. When stdout closes early during `shelf list` (for example `shelf list | head -1` or
   `shelf list | true` with a long list), nothing is put on stderr and the exit code is 0: in the
   founder's words, "stderr empty and exit 0 when stdout closes early". What the reader took before
   closing, if anything (`true` takes nothing), is the start of the listing of criteria 1 and 2,
   and `shelf.json` is untouched (criterion 5). [D-3; amendment 3]

### REQ-03: Mark a book read

**User:** the reader. [scope]

**Flow**
1. The reader runs `shelf done` followed by an id.
2. shelf sets that book's status to "read" and prints one line.

**Acceptance**
1. `shelf done 1` on a "to read" book 1 titled `Dune` prints exactly `done 1 Dune`, exits 0, and
   `shelf list` then shows `1 read Dune`. [scope]
2. Other books are unchanged by it. [scope]
3. `shelf done 1` on a book that is already "read" prints `done 1 <title>` again, exits 0, and
   leaves the book "read". [Q3]
4. Missing id: `shelf done` with no id exits 2, puts a message on stderr and prints nothing on
   stdout. [scope, Q11]
5. Non-numeric id: `shelf done abc`, `shelf done 1.5`, `shelf done -1`, `shelf done 1a` and
   `shelf done +1` each exit 2, put a message on stderr and print nothing on stdout. [scope, Q5,
   Q11]
6. Unknown id: `shelf done 99` where no book 99 exists exits 1, puts a message on stderr and
   prints nothing on stdout. [scope, Q11]
7. `shelf done 0` exits 1, puts a message on stderr and prints nothing on stdout, because 0 is an
   unknown id. [Q5, Q11]
8. `shelf done 007` marks book 7 read when book 7 exists, and prints exactly `done 7 <title>`.
   [scope, Q5]
9. Extra arguments are ignored: `shelf done 1 2` acts on book 1 only. [Q7]
10. Missing, non-numeric and unknown ids leave `shelf.json` and every book unchanged. [scope, Q13]
11. Argument errors win over file errors: `shelf done abc` while `shelf.json` is corrupt exits 2,
    puts a message on stderr, prints nothing on stdout, and leaves `shelf.json` untouched.
    [Q15, Q11, scope]
12. Argument errors win over file errors: `shelf done` (missing id) while `shelf.json` is
    unreadable exits 2, puts a message on stderr, prints nothing on stdout, and leaves
    `shelf.json` untouched. [Q15, Q11, scope]
13. `shelf done 007` when there is no book 7 exits 1, puts a message on stderr and prints nothing
    on stdout. [Q5, Q11]
14. `shelf done ""` (an empty-string id) exits 2, puts a message on stderr and prints nothing on
    stdout. [Q5, Q11]

### REQ-04: Drop a book

**User:** the reader. [scope]

**Flow**
1. The reader runs `shelf drop` followed by an id.
2. shelf removes that book and prints one line.

**Acceptance**
1. `shelf drop 2` on book 2 titled `Emma` prints exactly `dropped 2 Emma`, exits 0, and
   `shelf list` no longer shows it. [scope]
2. Other books keep their ids, statuses and titles. [scope, Q2]
3. A "read" book and a "to read" book can both be dropped. [scope]
4. Missing id: `shelf drop` with no id exits 2, puts a message on stderr and prints nothing on
   stdout. [scope, Q11]
5. Non-numeric id: `shelf drop abc`, `shelf drop 1.5`, `shelf drop -1`, `shelf drop 1a` and
   `shelf drop +1` each exit 2, put a message on stderr and print nothing on stdout. [scope, Q5,
   Q11]
6. Unknown id: `shelf drop 99` where no book 99 exists exits 1, puts a message on stderr and
   prints nothing on stdout. [scope, Q11]
7. `shelf drop 0` exits 1, puts a message on stderr and prints nothing on stdout, because 0 is an
   unknown id. [Q5, Q11]
8. `shelf drop 007` drops book 7 when book 7 exists, and prints exactly `dropped 7 <title>`.
   [scope, Q5]
9. Extra arguments are ignored: `shelf drop 1 2` acts on book 1 only. [Q7]
10. Missing, non-numeric and unknown ids leave `shelf.json` and every book unchanged. [scope, Q13]
11. Argument errors win over file errors: `shelf drop abc` while `shelf.json` is corrupt exits 2,
    puts a message on stderr, prints nothing on stdout, and leaves `shelf.json` untouched.
    [Q15, Q11, scope]
12. `shelf drop 007` when there is no book 7 exits 1, puts a message on stderr and prints nothing
    on stdout. [Q5, Q11]
13. `shelf drop ""` (an empty-string id) exits 2, puts a message on stderr and prints nothing on
    stdout. [Q5, Q11]
14. Argument errors win over file errors: `shelf drop` (missing id) while `shelf.json` is corrupt
    exits 2, puts a message on stderr, prints nothing on stdout, and leaves `shelf.json`
    untouched. [Q15, Q11]

### REQ-05: Refuse an unknown command

**User:** the reader. [scope]

**Flow**
1. The reader runs `shelf` with a word that is not one of the four commands, or with no word.
2. shelf prints usage on stderr and exits.

**Acceptance**
1. `shelf frobnicate` exits 2, prints usage on stderr and prints nothing on stdout. [scope, Q11]
2. A bare `shelf` exits 2, prints usage on stderr and prints nothing on stdout. [Q6]
3. `shelf search x` and `shelf rate 1 5` are unknown commands: each exits 2, prints usage on
   stderr and prints nothing on stdout. [scope, Q11]
4. An unknown command leaves `shelf.json` untouched. [scope, Q13]
5. Argument errors win over file errors: `shelf frobnicate` while `shelf.json` is corrupt exits 2,
   prints usage on stderr, prints nothing on stdout, and leaves `shelf.json` untouched.
   [Q15, Q11, scope]

### REQ-06: Treat a missing shelf file as an empty shelf

**User:** the reader. [Q1]

**Flow**
1. The reader runs a command in a directory with no `shelf.json`.
2. shelf behaves as if the shelf were empty.

`shelf add` on a missing shelf file is covered by REQ-01 criterion 8.

**Acceptance**
1. `shelf list` with no `shelf.json` prints nothing and exits 0. [Q1]
2. `shelf list` with no `shelf.json` does not create the file. [Q1]
3. `shelf done 1` with no `shelf.json` exits 1, puts a message on stderr, prints nothing on stdout
   and does not create `shelf.json` (unknown id). [Q1, Q11, Q13, scope]
4. `shelf drop 1` with no `shelf.json` exits 1, puts a message on stderr, prints nothing on stdout
   and does not create `shelf.json` (unknown id). [Q1, Q11, Q13, scope]
5. `shelf add ""` with no `shelf.json` exits 2, puts a message on stderr, prints nothing on stdout
   and does not create `shelf.json`. [Q13, Q1, Q11]
6. `shelf done abc` with no `shelf.json` exits 2, puts a message on stderr, prints nothing on
   stdout and does not create `shelf.json`. [Q13, Q1, Q11]
7. `shelf frobnicate` with no `shelf.json` exits 2, prints usage on stderr, prints nothing on
   stdout and does not create `shelf.json`. [Q13, Q1, Q11]

### REQ-07: Refuse an unreadable shelf file

**User:** the reader. [scope]

**Flow**
1. The reader runs a command while `shelf.json` is unreadable.
2. shelf stops, reports the problem and leaves the file as it was.

**Acceptance**
1. `shelf list` exits 1, puts a message on stderr and prints nothing on stdout. [scope, Q11]
2. `shelf add Dune` exits 1, puts a message on stderr and prints nothing on stdout. [scope, Q11]
3. `shelf done 1` exits 1, puts a message on stderr and prints nothing on stdout. [scope, Q11]
4. `shelf drop 1` exits 1, puts a message on stderr and prints nothing on stdout. [scope, Q11]
5. `shelf.json` is left untouched. [scope]

### REQ-08: Refuse when the shelf file cannot be written

**User:** the reader. [Q10]

**Flow**
1. The reader runs `add`, `done` or `drop` while `shelf.json` (or its directory) cannot be written.
2. shelf stops and reports the problem.

**Acceptance**
1. `shelf add Dune` exits 1, puts a message on stderr and prints nothing on stdout. [Q10, Q11]
2. `shelf done 1` exits 1, puts a message on stderr and prints nothing on stdout. [Q10, Q11]
3. `shelf drop 1` exits 1, puts a message on stderr and prints nothing on stdout. [Q10, Q11]
4. In each case nothing is changed on disk. [Q10]
5. Two commands at once: when two shelf commands are started in the same moment on the same
   `shelf.json` (two processes, for example `shelf done 1` and `shelf done 2`), a command that is
   refused because the file cannot be written changes nothing, so its book keeps the status it had
   in `shelf list` afterwards; and a command that exits 0 printed a line that was true of the shelf
   at some moment, so when one or both exit 0 at least one of their changes shows in `shelf list`
   afterwards. That the other change may be lost when both exit 0 is accepted, and is the
   blueprint's (section 8). [D-2; amendment 2]

### REQ-09: Refuse a corrupt shelf file

**User:** the reader. [scope]

**Flow**
1. The reader runs a command while `shelf.json` is corrupt.
2. shelf stops, reports the problem and leaves the file as it was.

**Acceptance**
1. Not valid JSON: `shelf list` exits 1, puts a message on stderr and prints nothing on stdout.
   [scope, Q9, Q11]
2. Not valid JSON: `shelf add Dune` exits 1, puts a message on stderr and prints nothing on
   stdout. [scope, Q9, Q11]
3. Not valid JSON: `shelf done 1` exits 1, puts a message on stderr and prints nothing on stdout.
   This is because `1` is a numeric id, which passes the argument check, so the file must then be
   read. [scope, Q9, Q11, Q15]
4. Not valid JSON: `shelf drop 1` exits 1, puts a message on stderr and prints nothing on stdout.
   [scope, Q9, Q11]
5. Valid JSON of the wrong shape (an array, a number, or an object missing its books or its next
   id): `shelf list` exits 1, puts a message on stderr and prints nothing on stdout. [Q9, Q11]
6. Valid JSON of the wrong shape: `shelf add Dune` exits 1, puts a message on stderr and prints
   nothing on stdout. [Q9, Q11]
7. Valid JSON of the wrong shape: `shelf done 1` exits 1, puts a message on stderr and prints
   nothing on stdout. [Q9, Q11]
8. Valid JSON of the wrong shape: `shelf drop 1` exits 1, puts a message on stderr and prints
   nothing on stdout. [Q9, Q11]
9. A `shelf.json` that is not valid JSON is left untouched by each of the four commands.
   [scope, Q9]
10. A `shelf.json` of valid JSON but the wrong shape is left untouched by each of the four
    commands. [scope, Q9]

## 6. Non-functional requirements

- Runs on Node 22. [scope]
- No dependencies. [scope]
- Runs as a command-line tool on the reader's own machine. [scope]
- The shelf is `shelf.json` in the current directory. [scope]
- The wording of error messages and of usage is recorded in the technical blueprint and is not an
  acceptance criterion; criteria require only that a message, or usage, appears on stderr. For
  usage, a criterion may additionally require that the four command words `add`, `list`, `done` and
  `drop` appear in the text on stderr. [Q14, Q19, D11]

## 7. Non-goals

Version one deliberately does not: [scope]

- be a web app or a server, or use a database;
- search, rate, or record dates;
- serve more than one person;
- refuse a duplicate title (Q8);
- ship more than two stories: story 1 is add and list, story 2 is done and drop.

## 8. Open questions

No question is open. Q11 to Q14 closed the four questions listed in revision 1; Q15 closed the
precedence of argument errors and file errors.

## 9. Change log

- **Revision 1**: first draft from the confirmed scope and Q1 to Q10.
- **Revision 2**: closes the four open questions of revision 1 with the user's answers:
  - Q11, "Yes, nothing on stdout for any error." Every error criterion now states that nothing is
    printed on stdout.
  - Q12, "Trim, as you recommend." The Title definition trims leading and trailing whitespace;
    REQ-01 criterion 12 added.
  - Q13, "No. Only a successful add creates the file; every failed command leaves the disk as it
    was." Added to the definitions as Failed command; REQ-06 criteria 3 and 4 amended.
  - Q14, "Your default stands." The wording of messages and usage is the blueprint's; recorded under
    Non-functional requirements.

  Three rubric defects returned by the orchestrator: REQ-07 bundled two causes, so it now holds the
  unreadable criteria only and the corrupt criteria are appended as REQ-09 (REQ-08 not renumbered);
  the problem statement carried words that are not the user's, and is now limited to the scope;
  REQ-06 criterion 5 was a pointer, not a criterion, and is now a sentence under the Flow.
- **Revision 3**: Q15, "Option A: argument errors win." Added the definition Order of checks and the
  criteria REQ-01 13, REQ-03 11 and 12, REQ-04 11 and REQ-05 5; REQ-09 criterion 3 now notes why a
  numeric id leaves the file error at exit 1. Two corrections from the gate 3 findings:
  - F-01: section 3 claimed more than its criteria back; it now claims only that `shelf search` and
    `shelf rate` are refused (REQ-05 criterion 3), and dates, a web app, a server and a database are
    named as non-goals, not role prohibitions. No criterion added for it.
  - F-02: REQ-03 criterion 8 and REQ-04 criterion 8 now state the printed line for `007`:
    `done 7 <title>` and `dropped 7 <title>`.
- **Revision 4**: no user answer was needed, so none is quoted. Four corrections from findings
  F2-01 to F2-04 of the second gate-3 check:
  - F2-01: REQ-01 criterion 1 now says "never-used shelf", since an emptied shelf does not restart
    at 1 (criterion 7, Id definition).
  - F2-02: REQ-03 criteria 13 and 14 and REQ-04 criteria 12 and 13 back the definitions for `007`
    with no book 7 and for the empty-string id.
  - F2-03: the Order of checks definition says the criteria sample the rule; REQ-01 criterion 14
    and REQ-04 criterion 14 added as corrupt-file samples.
  - F2-04: REQ-06 criteria 5 to 7 added for argument errors with no `shelf.json`; the Untouched
    definition now covers an absent file.
- **Revision 5**: no user answer was needed, so none is quoted. Three corrections from findings
  F3-01 to F3-03 of the third gate-3 check:
  - F3-01: REQ-03 criteria 11 and 12, REQ-04 criterion 11 and REQ-05 criterion 5 now state, as
    REQ-01 criterion 13 does, that a message (usage, for REQ-05) goes on stderr, nothing goes on
    stdout and `shelf.json` is left untouched; they cite Q11 and scope.
  - F3-02: the last bullet of section 3 carried words that are not the user's; it now reads
    "There is no other role."
  - F3-03: the Corrupt shelf file definition says "its books" and "its next id" name what the file
    records, as Q9 does, and that the field names and exact shape are the blueprint's decision. No
    criterion changed.
- **Revision 6**: Q19 item 2, "Accept both recommendations: 1 Option A, 2 Option A." (item 2,
  Option A, is decision D11, which narrows Q14, decided 2026-10-28). Section 6 now adds one
  sentence: for usage, a criterion may additionally require that the four command words `add`,
  `list`, `done` and `drop` appear in the text on stderr. The wording of messages and usage is
  otherwise still unchecked. No requirement id and no criterion changed; REQ-05 criteria 1, 2, 3 and
  5 keep their wording, since the Usage definition already says the text lists the four commands.
- **Revision 7**: legend updated to Q1 to Q19 and the D-numbers; no requirement or criterion changed.
- **Revision 8**: legend corrected for Q16 to Q18 (gate 6 review R6-006 d); no requirement or
  criterion changed.
- **Revision 9**: increment amendment 1 (section 10), story 2, done and drop, from the founder's
  decision of 2026-10-28; no requirement or criterion added, changed or removed.
- **Revision 10**: increment amendment 2 (section 10), defect D-2, from the founder's decision of
  2026-10-28; REQ-08 criterion 5 added. No criterion changed or removed; no id reused. The legend
  names the `D-<n>` defect tag.
- **Revision 11**: increment amendment 3 (section 10), defect D-3, from the founder's decisions of
  2026-10-28 and 2026-10-29; REQ-02 criterion 8 and the definition "Stdout closes early" added. No
  criterion changed or removed; no id reused. The legend names D-3. The records of D-4 and D-1,
  carried in the same packet, change no requirement, criterion or definition.
- **Revision 12**: increment amendment 4 (section 10), defects D-5 and D-6 deferred by the
  founder's decision of 2026-10-30, and D-1's record reworded at the founder's instruction of the
  same day; no requirement, criterion or definition added, changed or removed; no id reused. The
  legend is unchanged, since no criterion carries D-5 or D-6.

## 10. Increment amendments

Amendments made after the first build landed (INCREMENT.md section 3, item 1). Each is numbered,
dated, and names who decided, in their words.

- **Amendment 1** (2026-10-28; decided by the founder). The founder's decision, in their words:
  "story 2 of the plan: done and drop, as docs/eval-plan.md and docs/PRD.md already specify". No
  product question was asked and none was answered. No requirement or criterion is added, changed
  or removed, and no id is reused: REQ-03 and REQ-04, and the `done` and `drop` criteria of REQ-06
  (c3, c4, c6), REQ-07 (c3, c4, c5), REQ-08 (c2, c3, c4) and REQ-09 (c3, c4, c7, c8, c9, c10),
  stand as written and are what story 2 builds (section 7, "story 2 is done and drop").
- **Amendment 2** (2026-10-28; decided by the founder, login ajpasco). Defect D-2
  (`docs/defects/D-2.md`), found by the QA pass of story 2 on main `a9c2f92`: two shelf commands
  started in the same moment could end with the command that reported failure having changed
  `shelf.json` and the command that reported success having changed nothing. The PRD was silent on
  two commands at once, though the Failed-command definition (section 4) already says a failed
  command never changes the file. The record put three behaviours to the founder: (a) accept and
  record it, (b) a per-process temporary file name, so a non-zero exit never changes the disk and a
  printed line always describes a document that was on disk, while the accepted lost update stays,
  (c) a lock. The founder's decision, in their words: "D-2: fix now, option (b), a per-process
  temporary file name." REQ-08 criterion 5 is added, stating option (b) as the reader observes it;
  the temporary file's name is a technical choice and is the blueprint's (TD-20). No criterion is
  changed or removed and no id is reused. Section 7's non-goal "ship more than two stories" is left
  as written: story 3 is the fix of a defect under INCREMENT.md section 9, which the founder
  decided, not a third feature.
- **Amendment 3** (2026-10-29; decided by the founder, login ajpasco, on 2026-10-28 and
  2026-10-29). Defect D-3 (`docs/defects/D-3.md`), found by the founder's independent code review
  on 2026-10-28 and reproduced by the QA orchestrator the same day: with a long list, a reader that
  closes the pipe early (`shelf list | head -1`, `shelf list | true`) got Node's unhandled EPIPE
  stack on stderr and exit 1. The PRD was silent on a reader that closes the pipe; blueprint
  section 12 had excluded the case as a recorded default. The record put three behaviours to the
  founder: a silent exit 0, one error line and exit 1, or exit 141 as a shell reports SIGPIPE. The
  founder's decision, in their words: "D-3, a closed pipe: with a long list, 'shelf list | head -1'
  or 'shelf list | true' prints Node's unhandled 'error' event (EPIPE) stack to stderr; fix now,
  the boundary in app/shelf.mjs, stderr empty and exit 0 when stdout closes early." REQ-02
  criterion 8 is added, stating the chosen behaviour in the founder's words, and the definition
  "Stdout closes early" (section 4) names the case it covers; how the boundary detects a closed
  pipe is a technical choice and is the blueprint's (TD-21). No criterion is changed or removed and
  no id is reused. On 2026-10-29 the founder started the increment and had the same packet carry
  two more records, in their words: "start D-3's increment, and carry in the same packet, by my
  decision: D-4's record, its reproducing row and its eval/deferred.txt line (deferred, reason:
  reachable only by a hand edit of shelf.json); D-1's record with my deferral (reason: it only
  happens when someone makes a directory named .shelf.json.tmp by hand) and Row: none, noting it
  is unreachable after TD-20; and the one-phrase fix to blueprint section 9's 'Two stories'." D-4
  (`docs/defects/D-4.md`, deferred) and D-1 (`docs/defects/D-1.md`, deferred, no row) change no
  requirement, criterion or definition of this PRD: the behaviour at the id ceiling D-4 names is
  undecided, so no criterion states it, and its row is deferred in `eval/deferred.txt`. Section 7's
  non-goal "ship more than two stories" is left as written: story 4 is the fix of a defect under
  INCREMENT.md section 9, which the founder decided, not a feature.
- **Amendment 4** (2026-10-30; decided by the founder, login ajpasco). Two defects found by the QA
  pass of all on main `6ba654d` (2026-10-29), both deferred, and a record's wording corrected.
  D-5 (`docs/defects/D-5.md`): a command killed while it writes leaves a stray temporary file
  beside `shelf.json` for good, the shelf itself whole. D-6 (`docs/defects/D-6.md`): with
  `shelf.json` a symbolic link to a file in another directory, `done 1` reports success, replaces
  the link with a regular file and never changes the linked file. This PRD is silent on both: the
  Failed-command definition (section 4) speaks of a non-zero exit code, which a killed process has
  none of, and section 2 says only that the shelf is `shelf.json` in the current directory, nothing
  about a link. Each record put three behaviours to the founder (D-5: record the stray file;
  remove stale temporary files on the next successful write; let a signalled command finish whole.
  D-6: follow the link and write its target; refuse a linked `shelf.json`; record a limitation). The
  founder's decision, in their words: "Defer both. D-5 deferred (record the stray file in the
  blueprint's Shutdown line); F-1 numbered D-6 and deferred (links aren't in the PRD). One deferral
  packet carries both, plus D-1's corrected wording." (Their "F-1" with the reason "links aren't in
  the PRD" is the symbolic-link report, now D-6; the stray-file finding is D-5.) Their instruction
  for the packet, the same day: "run /pod-works-increment for the D-5 and D-6 deferrals as one
  packet: both records, their rows listed in eval/deferred.txt, and D-1's record reworded to
  "reachable only by a directory named for the pid the process will get" (and "unlikely", not
  "unreachable"). No story files." No requirement, criterion or definition is added, changed or
  removed, and no id is reused: the founder chose no behaviour for either defect, so no criterion
  states one; the stray file is recorded in the blueprint's Shutdown line (blueprint section 12 and
  section 14, delta 4), and the rows T-REQ-08-N5 (D-5) and T-REQ-08-N6 (D-6) are deferred in
  `eval/deferred.txt` until the founder puts a defect in. D-1's record (`docs/defects/D-1.md`,
  deferred 2026-10-28, no row) now says its crash is reachable only by a directory named for the pid
  the process will get, and unlikely, where it said unreachable; its decision is unchanged. The
  packet has no story and builds nothing (INCREMENT.md section 3).
