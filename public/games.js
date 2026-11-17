/* The shelf. Every game on the site is one entry in this list, in shelf order.
   To add a game: copy an entry, change the words and the address, and push. That's the whole job.

   id       short word for links: the hub's address + #id opens that game's box (…/#clue)
   name     full name, shown inside the opened box
   box      the name as printed on the box (keep it short; defaults to name)
   url      the game's own address, no slash at the end
   tv       page for the big screen (every game so far uses /tv)
   phone    page for players' phones (every game so far uses /)
   pitch    one sentence, shown inside the opened box
   players  who can play
   screen   'needs' = a big screen is part of the game · 'optional' = phones alone work
   host     who runs it
   look     lid = box colour · ink = lettering · trim = the thin frame and accents
            font = one of the fonts in fonts/ (Anton, Cinzel, Lilita One, Germania One) or leave out
            art = picture on the lid, a file in art/ (leave out and the box shows the first letter) */

window.GAMES = [
  {
    id: 'feud', name: 'Friend Feud',
    url: 'https://feudnight.onrender.com', tv: '/tv', phone: '/',
    pitch: 'Two teams guess the most popular survey answers, with face-off buzzers, three strikes and a Fast Money finish.',
    players: 'Two teams, any size', screen: 'needs', host: 'One person hosts from their phone',
    look: { lid: '#1740b8', ink: '#ffffff', trim: '#f7c948', font: 'Anton', art: 'art/feud.svg' }
  },
  {
    id: 'jeopardy', name: 'Friend Jeopardy',
    url: 'https://friend-jeopardy.onrender.com', tv: '/tv', phone: '/',
    pitch: 'Pick a clue, buzz in, answer out loud. Two rounds, Daily Doubles and a Final wager, by the show’s rules.',
    players: '2 to 8, plus a host', screen: 'needs', host: 'One person reads the clues and judges',
    look: { lid: '#0a1f9c', ink: '#f5c542', trim: '#f5c542', font: 'Anton', art: 'art/jeopardy.svg' }
  },
  {
    id: 'wheel', name: 'Friend Wheel',
    url: 'https://wheel-of-fortune-ov4a.onrender.com', tv: '/tv', phone: '/',
    pitch: 'Swipe your phone to spin, call letters, buy vowels and solve the puzzle before anyone else does.',
    players: '2 to 8', screen: 'needs', host: 'Optional. The game checks answers itself',
    look: { lid: '#ffcc33', ink: '#20124d', trim: '#20124d', font: 'Anton', art: 'art/wheel.svg' }
  },
  {
    id: 'monopoly', name: 'Friend Monopoly',
    url: 'https://friend-monopoly.onrender.com', tv: '/tv', phone: '/',
    pitch: 'The official rules with the board on the TV: buy, build, trade and auction from your phone. Save it and pick up another night.',
    players: '2 to 8, bots can fill seats', screen: 'needs', host: 'None. The game runs itself',
    look: { lid: '#d5202a', ink: '#fff6df', trim: '#fff6df', font: 'Anton', art: 'art/monopoly.svg' }
  },
  {
    id: 'clue', name: 'Friend Clue',
    url: 'https://clue-4fcu.onrender.com', tv: '/tv', phone: '/',
    pitch: 'Who did it, with what, and where? Move room to room, make suggestions and keep a detective notebook on your phone.',
    players: '2 to 6, bots can fill seats', screen: 'needs', host: 'None. The game runs itself',
    look: { lid: '#1b3127', ink: '#f4ead5', trim: '#c9a050', font: 'Anton', art: 'art/clue.svg' }
  },
  {
    id: 'legendary', name: 'Legendary Friends: Quest for Trivia', box: 'Legendary Friends',
    url: 'https://legendary-friends-trivia-night.onrender.com', tv: '/tv', phone: '/',
    pitch: 'Team up as heroes and fight monsters by answering trivia together, world by world, all the way to the final boss.',
    players: '2 to 8, on one team', screen: 'needs', host: 'None. The game runs itself',
    look: { lid: '#3b3e47', ink: '#f0d48a', trim: '#d9b45a', font: 'Cinzel', art: 'art/legendary.svg' }
  },
  {
    id: 'bingo', name: 'Friend Bingo',
    url: 'https://bingo-9asx.onrender.com', tv: '/tv', phone: '/',
    pitch: 'The TV calls the balls, you daub your cards and shout BINGO. Rounds of patterns from one line to a blackout.',
    players: '1 to 12, bots can fill seats', screen: 'needs', host: 'None. The TV is the caller',
    look: { lid: '#14153d', ink: '#ffffff', trim: '#ff3d8b', font: 'Lilita One', art: 'art/bingo.svg' }
  },
  {
    id: 'settlers', name: 'Settlers of Friends',
    url: 'https://settlers-of-friends.onrender.com', tv: '/tv', phone: '/',
    pitch: 'Settle an island: collect resources, build roads and cities, and trade with the table. First to the points target wins.',
    players: '2 to 6, bots can fill seats', screen: 'optional', host: 'None. The game runs itself',
    look: { lid: '#1d5fa8', ink: '#fff3d1', trim: '#f2c14e', font: 'Germania One', art: 'art/settlers.svg' }
  }
];
