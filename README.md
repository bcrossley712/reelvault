# ReelVault 🎬

A cinematic home movie collection browser built with **Vue 3 + Vite**.  
Browse your physical collection like a streaming service — search, filter by genre, MPA rating, and your own letter grades, and click any title to see its full detail card including where it lives on your shelf.

---

## Project structure

```
reelvault/
├── public/
│   └── movies.xlsx       ← your movie spreadsheet goes here
├── src/
│   ├── assets/
│   │   └── main.css          ← global design tokens & base styles
│   ├── components/
│   │   ├── AppHeader.vue     ← sticky header with search
│   │   ├── FilterToolbar.vue ← genre chips + sort/filter dropdowns
│   │   ├── MovieCard.vue     ← individual movie tile
│   │   ├── MovieGrid.vue     ← responsive grid + loading/error/empty states
│   │   └── MovieModal.vue    ← full-detail overlay
│   ├── composables/
│   │   └── useMovies.js      ← data loading, parsing, filtering logic
│   ├── App.vue               ← root component, wires everything together
│   └── main.js               ← app entry point
├── index.html
├── vite.config.js
└── package.json
```

---

## Your spreadsheet

Place your Excel file at **`public/movies.xlsx`**.  
Column names are flexible — the app auto-detects them as long as each header contains one of these keywords:

| Field    | Recognised keywords |
|----------|---------------------|
| Title    | title |
| Genre    | genre, category |
| Grade    | rating, grade, score, letter |
| MPA      | mpa, mpaa, content rating, rated |
| Starring | starring, cast, actors, star |
| Year     | year, released, release |
| Location | location, shelf, storage, place, disc |
| Image    | image, img, poster, url, cover, photo |
| Synopsis | synopsis, description, plot, summary, overview |

The **Image** column should contain a direct URL to a poster image (e.g. from IMDB or TMDB). Leave blank to show a placeholder.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Add your spreadsheet
cp /path/to/your/movies.xlsx public/movies.xlsx

# 3. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in any browser on your network.

---

## Build for hosting

```bash
npm run build
```

The `dist/` folder is a fully self-contained static site. Host it on:

- **A home NAS** (Synology, QNAP, etc.) with its built-in web server
- **A Raspberry Pi** running `npx serve dist`
- **Netlify / Vercel** — drag and drop the `dist/` folder (free tier)
- **GitHub Pages** — push `dist/` to the `gh-pages` branch

Any family member on your network (or the internet if hosted publicly) can browse your collection from a phone, tablet, or TV browser.

---

## Updating your collection

1. Edit `public/movies.xlsx` with any new titles.
2. Commit and push — the app re-reads the file on every page load.

No database, no backend, no server-side code.
