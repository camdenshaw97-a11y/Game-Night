# Game Night

One page that launches every game in the collection. It is a plain website (no server), hosted
as a free Static Site on Render, so it is always on.

## Adding a game

Open `public/games.js`, copy one entry, change the words and the address, and push. The top of that
file explains each line. A picture for the box lid is optional: put a square SVG in `public/art/`
and name it in the entry, or leave it out and the box shows the game's first letter.

Also add the game's link to the short fallback list inside `<noscript>` in `public/index.html`
(the test reminds you if you forget).

## How it works

- `public/index.html` the page · `public/style.css` the look · `public/hub.js` the behaviour ·
  `public/games.js` the list of games · `public/art/` box pictures · `public/fonts/` lettering.
- Every game answers at `/` (phones), `/tv` (the big screen) and `/qr.svg` (a small picture). The
  hub uses that picture to tell whether a game is awake: it asks for it, and a picture coming back
  means the server is up. Render's free plan sleeps a server after 15 idle minutes and needs about
  a minute to start it, so the hub shows a waiting screen and opens the game when it answers.
- Only the game whose box is open gets woken. The free plan's 750 hours a month are shared by all
  the games, so the hub never wakes them all at once.

## Render settings

New → Static Site → this repo. Build command: leave empty. Publish directory: `public`.
(`render.yaml` says the same thing.) Pushing to `main` redeploys it.

## Changing it

- Bump the version in three places: `package.json`, `VERSION` at the top of `public/hub.js`, and
  the `?v=` on the three files at the top and bottom of `public/index.html` (that last one makes
  browsers fetch the new files instead of reusing old ones).
- Add an entry to `CHANGELOG.md`.
- `npm test` (needs Python with playwright, and Chrome) opens the hub in a real browser against
  stand-ins for the game servers. Screenshots land in `test/shots/`.

## Fonts

Bricolage Grotesque, Anton, Cinzel, Lilita One and Germania One, all under the SIL Open Font
License.
