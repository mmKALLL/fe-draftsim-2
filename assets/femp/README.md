# Portrait & sprite assets

Folders under `assets/femp/`:

| Folder             | Used for                                                        |
| ------------------ | --------------------------------------------------------------- |
| `portraits/`       | Named player / recruitable unit faces (`<stem>.png`)            |
| `boss-portraits/`  | Named boss faces (`<stem>.png`)                                 |
| `enemy-portraits/` | Generic class fallbacks (`generic.png` is the last resort)      |
| `map/`, `biomes/`  | Map sprites and arena backgrounds                               |

## Filename ("stem") convention

A unit's portrait file is looked up by `portraitFileStem()` in
[`src/assets.ts`](../../src/assets.ts): it uses `FEMP_NAME_OVERRIDES[name]`
from [`data.ts`](../../data.ts) if present, otherwise `assetSlug(name)` —
the name lowercased with apostrophes and any non-`[a-z0-9]` characters
stripped.

- `Gerik` → `gerik.png`, `Athos` → `athos.png`
- `L'Arachel` → `larachel.png`

So **just name the file `<slug>.png`** and it resolves automatically. Only add
a `FEMP_NAME_OVERRIDES` entry when the file stem must differ from the slug
(e.g. reusing another character's portrait, or a non-obvious spelling).

## Cropping a portrait (96×80)

Portraits in `portraits/` are the **96×80 main face**. Source GBAFE mugshots
(e.g. from `fe-assets-db/`) are the full **128×112 sheet**: the 96×80 face is
in the top-left, the right 32px column is the small status-screen portrait, and
the bottom 32px strip holds the mouth/blink animation frames — all of which we
crop away.

Crop the top-left 96×80 with ImageMagick (`brew install imagemagick`):

```sh
magick <source-mug>.png -crop 96x80+0+0 +repage assets/femp/portraits/<stem>.png
```

`+repage` resets the canvas so the output is a clean 96×80 image. Verify the
result is exactly 96×80 (`sips -g pixelWidth -g pixelHeight <file>` on macOS)
and that the framing matches an existing portrait such as `portraits/raven.png`.
