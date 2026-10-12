# Third-party notices

## rotmg-asset-creator (rotmg-spritesheet-recompiler)

- Source: <https://github.com/faynt0/rotmg-asset-creator>
- License: ISC (declared in the project's `package.json`)
- Relation: `src/assets/` in this crate contains Rust ports of the
  TypeScript sources from that project:

  | Rust port    | Original                                                 |
  | ------------ | -------------------------------------------------------- |
  | `render.rs`  | `src/renderer.ts`                                        |
  | `sheet.rs`   | sprite-sheet recompilation from `src/index.ts`           |
  | `unity.rs`   | `src/unity-asset-parser.ts`                              |
  | `flatbuf.rs` | `Deca.SpriteSheetRoot` schema (`src/schema.fbs`) parsing |
  | `xml.rs`     | XML text-asset semantics (`fast-xml-parser` behavior)    |

ISC License:

Copyright (c) faynt0

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
