# Design

## File routing

`groupFilesByHOA` maps a `.txt` file to its kind by name prefix, checked in a fixed order (`nal_czynsz`, `pow_czynsz`, `wplaty`, `lok`) so the short `lok` prefix never shadows a longer one. Each HOA keeps a list of files per kind.

## Merging

`parseHoaFiles` parses every file of a kind and passes the results to `mergeParsedFiles`, which concatenates the entries and reports keys found in more than one file. Keys match the importers' record identity:

| Kind          | Key                                  |
| ------------- | ------------------------------------ |
| apartments    | owner ID, apartment ID               |
| charges       | owner ID, apartment ID, period, line |
| notifications | owner ID, apartment ID, line         |
| payments      | owner ID, apartment ID, year         |

Repeats inside a single file keep their existing handling (synthetic charge line numbers, first owner row wins), so only cross-file repeats are errors. One error is reported per file pair with up to five example keys, so importing the same file twice does not produce thousands of lines.

Duplicate errors are checked first in `validateHoaFiles` and are not affected by `skipValidation`: merging repeated rows would double the imported data.
