# Game Night: what changed, and when

Every change to the hub gets an entry here, newest first. The version number is the same one shown
in small print at the bottom of the page. Times are Pacific.

## 1.1.0 · November 17, 2026

**A new look, to match the games**
- The page is now a dark stage instead of the rec-room wall and walnut shelf: deep navy, a row of
  gold marquee bulbs across the top, and GAME NIGHT in the same tall lettering Friend Feud uses.
- The eight boxes still wear their own game's colours and lettering. They are now even-sized cards
  in a grid (four across on a computer, two across on a phone) instead of boxes on shelves.
- The opened box is dark too: the facts are easier to scan, the main button is a big gold one, and
  the waiting bar is gold.
- Friend Feud's box has a new picture, a red strike tile, to match its new logo.
- New home-screen icon and browser colour in the same navy.
- Nothing about how the page works has changed: same boxes, same wording, same waking of a
  sleeping game. `npm test` still checks 39 things (5 of them now ignore capital letters, because
  the big buttons and the waiting headline are shown in capitals).

## 1.0.0 · November 16, 2026

**First version: one address for every game**
- A shelf with a box for each of the eight games: Friend Feud, Friend Jeopardy, Friend Wheel,
  Friend Monopoly, Friend Clue, Legendary Friends, Friend Bingo and Settlers of Friends. Each box
  wears its own game's colours and lettering.
- Open a box to see what the game is, how many can play, whether it needs a TV and whether someone
  has to host. On a computer the main button puts the game on that screen; on a phone it joins as a
  player.
- **Waking a sleeping game.** The free hosting puts a game to sleep after 15 minutes with nobody on
  it. Opening a box wakes that one game, and if you press a button before it is up you get a
  "Setting up…" screen that opens the game by itself the moment it answers. Only the game you
  opened is woken, never all eight.
- A link with the game's short name on the end opens that box directly, for example `…/#clue`.
- The page can be saved to a phone's home screen and gets its own icon.
- The page asks search engines not to list it. Anyone with the address can still use it.
- The list of games is one file, `public/games.js`. Adding a game is one entry there.
- `npm test` opens the page in a real browser and checks 39 things, including a game that is
  awake, one that is asleep, one that is slow to answer and one that never answers.
