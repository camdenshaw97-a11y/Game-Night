/* Game Night: the hub.
   Puts the boxes on the shelf (from games.js), opens a box when it is tapped, and wakes the
   game's server before sending anyone to it.

   Why the waking: each game runs on Render's free plan, which puts a server to sleep after
   15 minutes with no visitors and takes about a minute to start it again. So when a box is
   opened, this page quietly asks that one game for a tiny picture it always has (/qr.svg).
   A picture coming back means the game is up. Only the opened game is woken, never all of
   them: the free plan's monthly hours are shared between every game. */

(function () {
  'use strict';

  var VERSION = '1.0.0';
  var GAMES = window.GAMES || [];

  var TRY_MS = 25000;        // how long one knock on the door may take before knocking again
  var RETRY_MS = 2500;       // pause after a knock that got the wrong answer
  var SLOW_MS = 1500;        // no answer by now: say "waking it up" instead of "checking"
  var STUCK_MS = 150000;     // no answer by now: stop and say so
  var EXPECT_MS = 60000;     // what the progress bar counts toward
  var ANYWAY_MS = 12000;     // when "Open it anyway" appears on the waiting screen
  var FRESH_MS = 10 * 60000; // a game seen awake this recently is not checked again

  var $ = function (id) { return document.getElementById(id); };
  var rack = $('rack'), dlg = $('box');
  var seenAwake = {};        // game id -> when it last answered
  var open = null;           // { game, state, since, stop, target, tick }

  var isPhone = (function () {
    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    return !!coarse && Math.min(window.innerWidth, screen.width || 9999) < 820;
  })();

  /* ---------------------------------------------------------------- shelf */

  function paint(el, look) {
    look = look || {};
    el.style.setProperty('--lid', look.lid || '#3a2a1e');
    el.style.setProperty('--ink2', look.ink || '#ffffff');
    el.style.setProperty('--trim', look.trim || look.ink || '#ffffff');
    if (look.font) el.style.setProperty('--face', "'" + look.font + "'"); else el.style.removeProperty('--face');
  }

  function make(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  GAMES.forEach(function (g) {
    var li = make('li'), b = make('button', 'box');
    b.type = 'button';
    b.setAttribute('aria-haspopup', 'dialog');
    paint(b, g.look);
    var art = make('span', 'art');
    if (g.look && g.look.art) {
      var img = make('img'); img.src = g.look.art; img.alt = ''; img.width = 64; img.height = 64;
      art.appendChild(img);
    } else {
      art.appendChild(make('span', 'letter', (g.box || g.name || '?').charAt(0)));
    }
    var label = make('span');
    label.appendChild(make('span', 'name', g.box || g.name));
    label.appendChild(make('span', 'who', g.players || ''));
    b.appendChild(art); b.appendChild(label);
    b.addEventListener('click', function () { openBox(g); });
    li.appendChild(b); rack.appendChild(li);
  });

  $('ver').textContent = VERSION;

  // Lettering differs a lot in width from font to font. Shrink any name whose longest word
  // doesn't fit its box, rather than letting it break in the middle of a word.
  function fitNames() {
    Array.prototype.forEach.call(rack.querySelectorAll('.name'), function (n) {
      var fit = 1;
      n.style.setProperty('--fit', fit);
      while (n.scrollWidth > n.clientWidth + 1 && fit > 0.55) { fit -= 0.04; n.style.setProperty('--fit', fit.toFixed(2)); }
    });
  }
  fitNames();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNames);
  var refit; window.addEventListener('resize', function () { clearTimeout(refit); refit = setTimeout(fitNames, 120); });

  /* --------------------------------------------------------------- waking */

  // Knocks on one game's door until it answers. Calls back with 'checking', 'waking', 'ready' or 'stuck'.
  function knock(game, say) {
    var over = false, timers = [], img = null;
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function stop() {
      over = true; timers.forEach(clearTimeout);
      if (img) { img.onload = img.onerror = null; img = null; }
    }
    function attempt() {
      if (over) return;
      var mine = img = new Image(), settled = false;
      var guard = later(function () { if (!settled) { settled = true; mine.onload = mine.onerror = null; attempt(); } }, TRY_MS);
      mine.onload = function () {
        if (settled || over) return; settled = true; clearTimeout(guard);
        seenAwake[game.id] = Date.now(); stop(); say('ready');
      };
      mine.onerror = function () {
        if (settled || over) return; settled = true; clearTimeout(guard);
        later(attempt, RETRY_MS);
      };
      mine.src = game.url + '/qr.svg?u=hub&t=' + Date.now();
    }
    if (seenAwake[game.id] && Date.now() - seenAwake[game.id] < FRESH_MS) { say('ready'); return function () {}; }
    say('checking');
    later(function () { if (!over) say('waking'); }, SLOW_MS);
    later(function () { if (!over) { stop(); say('stuck'); } }, STUCK_MS);
    attempt();
    return stop;
  }

  /* ----------------------------------------------------------- opened box */

  var STATUS = {
    checking: 'Checking if it is awake',
    waking: 'Waking it up. This takes up to a minute',
    ready: 'Awake and ready',
    stuck: 'No answer yet. Try again in a moment'
  };

  function openBox(g) {
    closeOut();
    paint(dlg, g.look);
    $('box-name').textContent = g.name;
    var art = $('box-art'), letter = $('box-letter');
    if (g.look && g.look.art) { art.src = g.look.art; art.hidden = false; letter.hidden = true; }
    else { art.hidden = true; letter.hidden = false; letter.textContent = (g.name || '?').charAt(0); }
    $('box-pitch').textContent = g.pitch || '';
    $('f-players').textContent = g.players || '';
    $('f-screen').textContent = g.screen === 'optional' ? 'Optional. Phones alone work' : 'Needed. A TV or a computer everyone can see';
    $('f-host').textContent = g.host || '';

    var tv = g.url + (g.tv || '/tv'), phone = g.url + (g.phone || '/');
    var main = $('act-main'), other = $('act-other'), hint = $('act-hint');
    if (isPhone) {
      main.textContent = g.screen === 'optional' ? 'Play on this phone' : 'Join on this phone';
      other.textContent = 'Open the big-screen page here';
      main.onclick = function () { choose(phone); };
      other.onclick = function () { choose(tv); };
      hint.textContent = g.screen === 'optional'
        ? 'No TV needed. Start a room here and share the code.'
        : 'Someone opens the game on the TV first. That is where the room code comes from.';
    } else {
      main.textContent = 'Put it on this screen';
      other.textContent = 'Join as a player on this device';
      main.onclick = function () { choose(tv); };
      other.onclick = function () { choose(phone); };
      hint.textContent = g.screen === 'optional'
        ? 'A TV is optional for this one. Any phone can start a room on its own.'
        : 'For the computer plugged into the TV. Players join by scanning the code it shows.';
    }

    open = { game: g, state: 'checking', since: Date.now(), target: null, tick: null, stop: null };
    show('info');
    open.stop = knock(g, onState);
    if (!dlg.open) dlg.showModal();
    try { history.replaceState(null, '', '#' + g.id); } catch (e) {}
  }

  function onState(state) {
    if (!open) return;
    open.state = state;
    var s = $('status');
    s.dataset.state = state;
    $('status-text').textContent = STATUS[state];
    if (state === 'ready' && open.target) return go(open.target);
    if (open.target) drawWait();
  }

  function show(view) {
    $('view-info').hidden = view !== 'info';
    $('view-wait').hidden = view !== 'wait';
  }

  // A button was pressed: go now if the game is up, otherwise wait on the waiting screen.
  function choose(url) {
    if (!open) return;
    if (open.state === 'ready') return go(url);
    open.target = url;
    if (open.state === 'stuck') { open.since = Date.now(); open.stop = knock(open.game, onState); }
    show('wait');
    drawWait();
    clearInterval(open.tick);
    open.tick = setInterval(drawWait, 500);
    $('wait-cancel').focus();
  }

  function drawWait() {
    if (!open || !open.target) return;
    var g = open.game, waited = Date.now() - open.since, stuck = open.state === 'stuck';
    $('wait-head').textContent = stuck ? (g.box || g.name) + ' is taking longer than usual' : 'Setting up ' + (g.box || g.name);
    $('wait-note').textContent = stuck
      ? 'Open it anyway and give the page a moment, or cancel and try again.'
      : 'It was asleep. It opens by itself as soon as it is up, usually in under a minute.';
    $('wait-bar').style.width = (stuck ? 96 : Math.min(94, 4 + 90 * waited / EXPECT_MS)) + '%';
    var anyway = $('wait-anyway');
    anyway.href = open.target;
    anyway.hidden = !(stuck || waited > ANYWAY_MS);
  }

  function go(url) {
    $('wait-bar').style.width = '100%';
    window.location.assign(url);
  }

  $('wait-cancel').addEventListener('click', function () {
    if (!open) return;
    open.target = null; clearInterval(open.tick);
    show('info');
    $('act-main').focus();
  });

  function closeOut() {
    if (!open) return;
    if (open.stop) open.stop();
    clearInterval(open.tick);
    open = null;
  }

  dlg.addEventListener('close', function () {
    closeOut();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });   // tap outside the box

  // Coming back with the Back button: the box you left is still open. Start it fresh, so there
  // is no stale "Setting up…" screen and the game is checked again.
  window.addEventListener('pageshow', function (e) { if (e.persisted && open) openBox(open.game); });

  // …/#clue opens that box straight away.
  function fromHash() {
    var id = (location.hash || '').slice(1).toLowerCase();
    var g = id && GAMES.filter(function (x) { return x.id === id; })[0];
    if (g && !(open && open.game === g)) openBox(g);
  }
  // (Waits for the page to finish loading first: a knock started earlier would keep the browser's
  // loading spinner going for as long as the game takes to wake.)
  window.addEventListener('hashchange', fromHash);
  if (document.readyState === 'complete') fromHash(); else window.addEventListener('load', fromHash);
})();
