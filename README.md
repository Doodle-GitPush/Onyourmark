# OnYourMark

Drop in an SVG logo and get a brand deck you can edit page by page, present
full screen, and export as a PDF.

## What it does

- **A first draft from one file.** Uploading a logo builds a deck — cover,
  logo, colour variations, clear space, palette, typography, motion, a 3D
  render and a story page — coloured from the artwork itself.
- **Edit it like a document.** Add, remove, duplicate and reorder pages
  (drag the thumbnails in the rail). Click any text on a page to rewrite it.
  Each page picks its own background from the palette.
- **One brand, every page.** The dock at the bottom holds the brand: logo,
  colours, typography and motion. Change one there and every page follows.
- **Typography.** Pick a starter pairing, or bring one from
  [JustMyType](https://github.com/Doodle-GitPush/justmytype) by pasting its
  share link (or arriving through its "Send to OnYourMark" button, which
  opens `/?jmt=<share link>`).
- **Motion.** Five shader backgrounds tinted with the brand colours; any
  cover, logo, story or text page can sit on one.
- **3D studio.** The logo extruded as an object, with materials, lighting and
  post-processing controls. The deck's 3D page shows what's set there.
- **Present and export.** Full-screen playback with live motion, or a
  1920×1080 PDF rendered from the same components as the editor.

Everything is saved in the browser (`localStorage`); there are no accounts.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

Set `GEMINI_API_KEY` to enable the Story page's "Write with AI". Without it
the page keeps its starter copy and everything else works.

## How it's put together

| Path | What lives there |
|---|---|
| `src/lib/brand.ts` | The `Brand` record — logo, palette, type, motion — that every page renders from |
| `src/lib/deck.ts` | Page kinds, the "add page" templates and the default deck |
| `src/lib/useDeck.ts` | The reducer for brand + pages, and persistence |
| `src/lib/svg.ts` | Logo preparation: sanitising, colour extraction, one-colour variants |
| `src/lib/shaders.ts` | The motion presets (GLSL) |
| `src/lib/justmytype.ts` | Reads JustMyType share links |
| `src/components/deck/Slide.tsx` | Draws any page. Sized entirely in `cqw`, so the same markup is a thumbnail, an editor page, a full-screen slide and a PDF page |
| `src/components/deck/` | The editor: page column, thumbnail rail, dock, present mode, PDF exporter |
| `src/components/Logo3DViewer.tsx` | The three.js scene |

Stack: Next.js 16 · React 19 · Tailwind v4 · Motion · three.js (react-three-fiber).
