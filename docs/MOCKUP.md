# Mockup: shelf

Mockup of PRD revision 8 (revisions 6 to 8 changed no criterion; the usage placeholder `<usage: lists add, list, done, drop>` already shows the four command words that the narrowed rule lets a row check). Terminal transcripts for every journey the PRD claims, and for no other.

Revision 6: the PRD revision this mockup follows is now 8. Revisions 6 to 8 changed no criterion, so no transcript and no Coverage row changed.

## Legend

- `$ shelf ...` is what the reader types, run in a directory that holds (or lacks) `shelf.json`.
- A plain line is a line on stdout, exactly as printed.
- `stderr: ...` is a line on stderr. Where the PRD does not fix the wording (Q14), the line is a
  placeholder: `stderr: <message>` for an error message, `stderr: <usage: lists add, list, done, drop>`
  for usage. The PRD requires only that a message, or usage naming the four commands, appears.
- `exit 0`, `exit 1`, `exit 2` is the exit code of the command above it.
- A command with no stdout lines printed nothing on stdout.
- `Setup:` lines say, in words, the state the directory is in. The state of `shelf.json` is only ever
  given as "absent", "untouched" or "now holds books 1, 2" (and so on). The file's contents are
  never shown; its shape is the blueprint's decision.
- Titles such as Dune, Emma and Ulysses are examples only.

---

## REQ-01: Add a book

### REQ-01 criteria 1, 2, 4

Setup: a never-used shelf: no `shelf.json`, or a `shelf.json` that has never held a book.

```
$ shelf add Dune
added 1 Dune
exit 0
$ shelf add Emma
added 2 Emma
exit 0
$ shelf list
1 to read Dune
2 to read Emma
exit 0
```

`shelf.json` now holds books 1, 2, both "to read".

### REQ-01 criterion 3

Setup: `shelf.json` holds books 1, 2 (Dune, Emma).

```
$ shelf add Dune Messiah
added 3 Dune Messiah
exit 0
```

The several arguments were joined with single spaces. `shelf.json` now holds books 1, 2, 3.

### REQ-01 criterion 5

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf add Dune
added 2 Dune
exit 0
$ shelf list
1 to read Dune
2 to read Dune
exit 0
```

No duplicate check refused it.

### REQ-01 criterion 6

Setup: `shelf.json` holds books 1, 2, 3 (Dune, Emma, Ulysses).

```
$ shelf drop 3
dropped 3 Ulysses
exit 0
$ shelf add X
added 4 X
exit 0
```

### REQ-01 criterion 7

Setup: `shelf.json` holds books 1, 2 (Dune, Emma).

```
$ shelf drop 1
dropped 1 Dune
exit 0
$ shelf drop 2
dropped 2 Emma
exit 0
$ shelf list
exit 0
$ shelf add Ulysses
added 3 Ulysses
exit 0
```

The shelf was emptied, and the next id is higher than any id used before.

### REQ-01 criterion 8

Setup: `shelf.json` absent.

```
$ shelf add Dune
added 1 Dune
exit 0
```

`shelf.json` now exists in the current directory and holds book 1.

### REQ-01 criteria 9, 10, 11

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf add
stderr: <message>
exit 2
$ shelf add ""
stderr: <message>
exit 2
$ shelf add "   "
stderr: <message>
exit 2
$ shelf list
1 to read Dune
exit 0
```

Each of the three printed nothing on stdout and added no book; `shelf.json` still holds book 1 only.

### REQ-01 criterion 12

Setup: `shelf.json` absent.

```
$ shelf add "  Dune "
added 1 Dune
exit 0
$ shelf list
1 to read Dune
exit 0
```

The stored title is `Dune`.

### REQ-01 criterion 13

Setup: `shelf.json` exists and its contents are not valid JSON.

```
$ shelf add ""
stderr: <message>
exit 2
```

The exit code is 2, not 1: the empty title is refused before the file is read. Nothing was printed on
stdout. `shelf.json` untouched.

### REQ-01 criterion 14

Setup: `shelf.json` exists and its contents are not valid JSON.

```
$ shelf add
stderr: <message>
exit 2
```

The exit code is 2, not 1: the missing title is refused before the file is read. Nothing was printed on
stdout. `shelf.json` untouched.

---

## REQ-02: List the books

### REQ-02 criteria 1, 4

Setup: `shelf.json` holds book 1 "to read" (Dune) and book 2 "read" (Emma).

```
$ shelf list
1 to read Dune
2 read Emma
exit 0
```

### REQ-02 criterion 2

Setup: books were added in the order Dune (1), Emma (2), Ulysses (3); then book 3 and then book 1 were
marked read.

```
$ shelf list
1 read Dune
2 to read Emma
3 read Ulysses
exit 0
```

Lines are in ascending id order, whatever order the books were added or changed in.

### REQ-02 criterion 3

Setup: `shelf.json` holds no books.

```
$ shelf list
exit 0
```

### REQ-02 criterion 5

Setup: `shelf.json` holds books 1, 2.

```
$ shelf list
1 to read Dune
2 to read Emma
exit 0
```

`shelf.json` untouched.

### REQ-02 criterion 6

Setup: directory A has a `shelf.json` holding book 1 (Dune). Directory B has a different `shelf.json`
holding book 1 (Ulysses).

```
(in directory A)
$ shelf list
1 to read Dune
exit 0
(in directory B)
$ shelf list
1 to read Ulysses
exit 0
```

### REQ-02 criterion 7

Setup: `shelf.json` holds books 1, 2.

```
$ shelf list x
1 to read Dune
2 to read Emma
exit 0
```

Same output and exit code as `shelf list`.

---

## REQ-03: Mark a book read

### REQ-03 criteria 1, 2

Setup: `shelf.json` holds book 1 "to read" (Dune) and book 2 "to read" (Emma).

```
$ shelf done 1
done 1 Dune
exit 0
$ shelf list
1 read Dune
2 to read Emma
exit 0
```

Book 2 is unchanged.

### REQ-03 criterion 3

Setup: `shelf.json` holds book 1 "read" (Dune).

```
$ shelf done 1
done 1 Dune
exit 0
$ shelf list
1 read Dune
exit 0
```

### REQ-03 criterion 4

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf done
stderr: <message>
exit 2
```

### REQ-03 criterion 5

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf done abc
stderr: <message>
exit 2
$ shelf done 1.5
stderr: <message>
exit 2
$ shelf done -1
stderr: <message>
exit 2
$ shelf done 1a
stderr: <message>
exit 2
$ shelf done +1
stderr: <message>
exit 2
```

Each printed nothing on stdout.

### REQ-03 criterion 6

Setup: `shelf.json` holds book 1 (Dune); there is no book 99.

```
$ shelf done 99
stderr: <message>
exit 1
```

### REQ-03 criterion 7

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf done 0
stderr: <message>
exit 1
```

### REQ-03 criterion 8

Setup: `shelf.json` holds books 1 to 7, all "to read": 1 Dune, 2 Emma, 3 Persuasion, 4 Beloved,
5 Middlemarch, 6 Kim, 7 Ulysses.

```
$ shelf done 007
done 7 Ulysses
exit 0
$ shelf list
1 to read Dune
2 to read Emma
3 to read Persuasion
4 to read Beloved
5 to read Middlemarch
6 to read Kim
7 read Ulysses
exit 0
```

Books 1 to 6 are unchanged.

### REQ-03 criterion 9

Setup: `shelf.json` holds books 1, 2, both "to read".

```
$ shelf done 1 2
done 1 Dune
exit 0
$ shelf list
1 read Dune
2 to read Emma
exit 0
```

### REQ-03 criterion 10

Setup: `shelf.json` holds book 1 "to read" (Dune).

```
$ shelf done
stderr: <message>
exit 2
$ shelf done abc
stderr: <message>
exit 2
$ shelf done 99
stderr: <message>
exit 1
$ shelf list
1 to read Dune
exit 0
```

`shelf.json` untouched by the three failed commands; every book unchanged.

### REQ-03 criterion 11

Setup: `shelf.json` exists and its contents are not valid JSON.

```
$ shelf done abc
stderr: <message>
exit 2
```

The exit code is 2, not 1. Nothing was printed on stdout. `shelf.json` untouched.

### REQ-03 criterion 12

Setup: `shelf.json` exists, holds books, and has been made unreadable.

```
$ shelf done
stderr: <message>
exit 2
```

The exit code is 2, not 1. Nothing was printed on stdout. `shelf.json` untouched.

### REQ-03 criterion 13

Setup: `shelf.json` holds book 1 (Dune); there is no book 7.

```
$ shelf done 007
stderr: <message>
exit 1
```

Nothing was printed on stdout.

### REQ-03 criterion 14

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf done ""
stderr: <message>
exit 2
```

Nothing was printed on stdout.

---

## REQ-04: Drop a book

### REQ-04 criteria 1, 2

Setup: `shelf.json` holds book 1 "to read" (Dune), book 2 "to read" (Emma), book 3 "read" (Ulysses).

```
$ shelf drop 2
dropped 2 Emma
exit 0
$ shelf list
1 to read Dune
3 read Ulysses
exit 0
```

Books 1 and 3 keep their ids, statuses and titles.

### REQ-04 criterion 3

Setup: `shelf.json` holds book 1 "to read" (Dune) and book 2 "read" (Emma).

```
$ shelf drop 1
dropped 1 Dune
exit 0
$ shelf drop 2
dropped 2 Emma
exit 0
$ shelf list
exit 0
```

### REQ-04 criterion 4

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf drop
stderr: <message>
exit 2
```

### REQ-04 criterion 5

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf drop abc
stderr: <message>
exit 2
$ shelf drop 1.5
stderr: <message>
exit 2
$ shelf drop -1
stderr: <message>
exit 2
$ shelf drop 1a
stderr: <message>
exit 2
$ shelf drop +1
stderr: <message>
exit 2
```

Each printed nothing on stdout.

### REQ-04 criterion 6

Setup: `shelf.json` holds book 1 (Dune); there is no book 99.

```
$ shelf drop 99
stderr: <message>
exit 1
```

### REQ-04 criterion 7

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf drop 0
stderr: <message>
exit 1
```

### REQ-04 criterion 8

Setup: `shelf.json` holds books 1 to 7: 1 Dune, 2 Emma, 3 Persuasion, 4 Beloved, 5 Middlemarch,
6 Kim, 7 Ulysses; all "to read".

```
$ shelf drop 007
dropped 7 Ulysses
exit 0
$ shelf list
1 to read Dune
2 to read Emma
3 to read Persuasion
4 to read Beloved
5 to read Middlemarch
6 to read Kim
exit 0
```

Book 7 is not listed.

### REQ-04 criterion 9

Setup: `shelf.json` holds books 1, 2.

```
$ shelf drop 1 2
dropped 1 Dune
exit 0
$ shelf list
2 to read Emma
exit 0
```

### REQ-04 criterion 10

Setup: `shelf.json` holds book 1 "to read" (Dune).

```
$ shelf drop
stderr: <message>
exit 2
$ shelf drop abc
stderr: <message>
exit 2
$ shelf drop 99
stderr: <message>
exit 1
$ shelf list
1 to read Dune
exit 0
```

`shelf.json` untouched by the three failed commands; every book unchanged.

### REQ-04 criterion 11

Setup: `shelf.json` exists and its contents are not valid JSON.

```
$ shelf drop abc
stderr: <message>
exit 2
```

The exit code is 2, not 1. Nothing was printed on stdout. `shelf.json` untouched.

### REQ-04 criterion 12

Setup: `shelf.json` holds book 1 (Dune); there is no book 7.

```
$ shelf drop 007
stderr: <message>
exit 1
```

Nothing was printed on stdout.

### REQ-04 criterion 13

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf drop ""
stderr: <message>
exit 2
```

Nothing was printed on stdout.

### REQ-04 criterion 14

Setup: `shelf.json` exists and its contents are not valid JSON.

```
$ shelf drop
stderr: <message>
exit 2
```

The exit code is 2, not 1: the missing id is refused before the file is read. Nothing was printed on
stdout. `shelf.json` untouched.

---

## REQ-05: Refuse an unknown command

### REQ-05 criterion 1

```
$ shelf frobnicate
stderr: <usage: lists add, list, done, drop>
exit 2
```

### REQ-05 criterion 2

```
$ shelf
stderr: <usage: lists add, list, done, drop>
exit 2
```

### REQ-05 criterion 3

```
$ shelf search x
stderr: <usage: lists add, list, done, drop>
exit 2
$ shelf rate 1 5
stderr: <usage: lists add, list, done, drop>
exit 2
```

### REQ-05 criterion 4

Setup: `shelf.json` holds book 1 (Dune).

```
$ shelf frobnicate
stderr: <usage: lists add, list, done, drop>
exit 2
```

`shelf.json` untouched.

### REQ-05 criterion 5

Setup: `shelf.json` exists and its contents are not valid JSON.

```
$ shelf frobnicate
stderr: <usage: lists add, list, done, drop>
exit 2
```

The exit code is 2, not 1. Nothing was printed on stdout. `shelf.json` untouched.

---

## REQ-06: Treat a missing shelf file as an empty shelf

`shelf add` on a missing shelf file is shown under REQ-01 criterion 8.

### REQ-06 criteria 1, 2

Setup: `shelf.json` absent.

```
$ shelf list
exit 0
```

`shelf.json` still absent.

### REQ-06 criterion 3

Setup: `shelf.json` absent.

```
$ shelf done 1
stderr: <message>
exit 1
```

`shelf.json` still absent.

### REQ-06 criterion 4

Setup: `shelf.json` absent.

```
$ shelf drop 1
stderr: <message>
exit 1
```

`shelf.json` still absent.

### REQ-06 criterion 5

Setup: `shelf.json` absent.

```
$ shelf add ""
stderr: <message>
exit 2
```

Nothing was printed on stdout. `shelf.json` still absent.

### REQ-06 criterion 6

Setup: `shelf.json` absent.

```
$ shelf done abc
stderr: <message>
exit 2
```

Nothing was printed on stdout. `shelf.json` still absent.

### REQ-06 criterion 7

Setup: `shelf.json` absent.

```
$ shelf frobnicate
stderr: <usage: lists add, list, done, drop>
exit 2
```

Nothing was printed on stdout. `shelf.json` still absent.

---

## REQ-07: Refuse an unreadable shelf file

Setup for every transcript below: `shelf.json` exists, holds books, and has been made unreadable.

### REQ-07 criterion 1

```
$ shelf list
stderr: <message>
exit 1
```

### REQ-07 criterion 2

```
$ shelf add Dune
stderr: <message>
exit 1
```

### REQ-07 criterion 3

```
$ shelf done 1
stderr: <message>
exit 1
```

### REQ-07 criterion 4

```
$ shelf drop 1
stderr: <message>
exit 1
```

### REQ-07 criterion 5

After the four commands above, `shelf.json` is untouched.

---

## REQ-08: Refuse when the shelf file cannot be written

Setup for every transcript below: `shelf.json` holds book 1 (Dune), and `shelf.json` (or its
directory) has been made unwritable. It is still readable.

### REQ-08 criteria 1, 4

```
$ shelf add Ulysses
stderr: <message>
exit 1
```

Nothing changed on disk.

### REQ-08 criteria 2, 4

```
$ shelf done 1
stderr: <message>
exit 1
```

Nothing changed on disk.

### REQ-08 criteria 3, 4

```
$ shelf drop 1
stderr: <message>
exit 1
```

Nothing changed on disk.

---

## REQ-09: Refuse a corrupt shelf file

### REQ-09 criteria 1, 2, 3, 4, 9

Setup: `shelf.json` exists and its contents are not valid JSON.

```
$ shelf list
stderr: <message>
exit 1
$ shelf add Dune
stderr: <message>
exit 1
$ shelf done 1
stderr: <message>
exit 1
$ shelf drop 1
stderr: <message>
exit 1
```

Each printed nothing on stdout. `shelf.json` untouched by each of the four commands.

### REQ-09 criteria 5, 6, 7, 8, 10

Each of the following four setups is run in turn with the same four commands. In each, `shelf.json`
exists and holds valid JSON of the wrong shape:

- (a) an array;
- (b) a number;
- (c) an object missing its books;
- (d) an object missing its next id.

```
$ shelf list
stderr: <message>
exit 1
$ shelf add Dune
stderr: <message>
exit 1
$ shelf done 1
stderr: <message>
exit 1
$ shelf drop 1
stderr: <message>
exit 1
```

For each setup (a) to (d), each command printed nothing on stdout, and `shelf.json` is untouched
by each of the four commands.

---

## Coverage

| Requirement | Criteria | Demonstrated by |
|---|---|---|
| REQ-01 | 1 to 14 | 1, 2, 4: first transcript; 3; 5; 6; 7; 8; 9, 10, 11; 12; 13; 14. All fourteen shown. The "file untouched" part of criteria 13 and 14 is a stated file state. |
| REQ-02 | 1 to 7 | 1, 4; 2; 3; 5; 6; 7. All seven shown. Criterion 5 is demonstrated by a stated file state, "untouched", beside a transcript, not by a command's output. |
| REQ-03 | 1 to 14 | 1, 2; 3; 4; 5; 6; 7; 8; 9; 10; 11; 12; 13; 14. All fourteen shown. The "file untouched" part of criteria 10, 11 and 12 is a stated file state. |
| REQ-04 | 1 to 14 | 1, 2; 3; 4; 5; 6; 7; 8; 9; 10; 11; 12; 13; 14. All fourteen shown. The "file untouched" part of criteria 10, 11 and 14 is a stated file state. |
| REQ-05 | 1 to 5 | 1; 2; 3; 4; 5. All five shown. Criterion 4 is demonstrated by a stated file state, "untouched", beside a transcript, not by a command's output. The "file untouched" part of criterion 5 is a stated file state. |
| REQ-06 | 1 to 7 | 1, 2; 3; 4; 5; 6; 7. All seven shown. The "file not created" part of criteria 2 to 7 is a stated file state, "still absent". |
| REQ-07 | 1 to 5 | 1; 2; 3; 4; 5. All five shown. Criterion 5 is demonstrated by a stated file state, "untouched", beside the transcripts, not by a command's output. |
| REQ-08 | 1 to 4 | 1, 4; 2, 4; 3, 4. All four shown. Criterion 4 is demonstrated by a stated file state, "nothing changed on disk", beside the transcripts, not by a command's output. |
| REQ-09 | 1 to 10 | 1, 2, 3, 4, 9; 5, 6, 7, 8, 10. All ten shown. Criteria 9 and 10 are demonstrated by a stated file state, "untouched", beside the transcripts, not by a command's output. |

Every criterion of REQ-01 to REQ-09 (80 in total) appears in at least one transcript. Six criteria
(REQ-02 criterion 5, REQ-05 criterion 4, REQ-07 criterion 5, REQ-08 criterion 4, and REQ-09
criteria 9 and 10) are demonstrated by a stated file state beside a transcript, not by a command's
output, because the file's contents are never shown. The same holds for the file-state part of
REQ-01 criteria 8, 13 and 14, REQ-03 criteria 10, 11 and 12, REQ-04 criteria 10, 11 and 14, REQ-05
criterion 5, and REQ-06 criteria 2 to 7; the rest of each of those is shown as a command and its
output. The wording of every error message and of usage is a placeholder, because the PRD leaves it
to the blueprint (Q14). The mockup adds no command, option, output line or behaviour
beyond the PRD.
