"""Opens the hub in a real browser and checks that it works.

    python3 test/check.py            (from the repo folder; needs Python's playwright and Chrome)

The live games can't be reached from a test, so each game's address is answered here by a stand-in
that behaves like Render does: awake (answers at once), asleep-then-up (a "starting…" web page for
a few seconds, then the real thing), held (holds the request open, then answers) or dead (never right).
Screenshots land in test/shots/."""

import functools, http.server, os, pathlib, sys, threading, time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUB = ROOT / 'public'
SHOTS = ROOT / 'test' / 'shots'
SHOTS.mkdir(exist_ok=True)
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>'

results = []
def check(name, ok, extra=''):
    results.append(ok)
    print(('  ok   ' if ok else '  FAIL ') + name + (('  [' + str(extra) + ']') if extra and not ok else ''))

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    h = functools.partial(Quiet, directory=str(PUB))
    s = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, 'http://127.0.0.1:%d/' % s.server_address[1]

class Games:
    """Stand-ins for the eight game servers."""
    def __init__(self):
        self.mode = {}        # host -> 'awake' | 'dead' | 'held' | ('asleep', seconds)
        self.first = {}       # host -> time of first knock
        self.knocks = {}      # host -> count
        self.held = []        # requests being held open
    def release(self):
        for r in self.held: r.fulfill(status=200, content_type='image/svg+xml', body=SVG)
        self.held = []
    def release_bad(self):
        for r in self.held: r.fulfill(status=502, content_type='text/html', body='<h1>Bad gateway</h1>')
        self.held = []
    def handle(self, route):
        req = route.request
        host = req.url.split('/')[2]
        path = '/' + req.url.split('/', 3)[3] if req.url.count('/') > 2 else '/'
        mode = self.mode.get(host, 'awake')
        if path.startswith('/qr.svg'):
            self.knocks[host] = self.knocks.get(host, 0) + 1
            self.first.setdefault(host, time.time())
            since = time.time() - self.first[host]
            if mode == 'dead':
                return route.fulfill(status=502, content_type='text/html', body='<h1>Bad gateway</h1>')
            if isinstance(mode, tuple) and mode[0] == 'asleep' and since < mode[1]:
                return route.fulfill(status=200, content_type='text/html', body='<h1>Your service is starting…</h1>')
            if mode == 'held':           # Render holding the request while the server starts
                self.held.append(route); return
            return route.fulfill(status=200, content_type='image/svg+xml', body=SVG)
        return route.fulfill(status=200, content_type='text/html', body='<title>game</title><h1 id="landed">' + host + path + '</h1>')

def new_page(browser, games, phone=False, errors=None):
    kw = dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True) if phone \
        else dict(viewport={'width': 1440, 'height': 900})
    ctx = browser.new_context(**kw)
    ctx.route('**://*.onrender.com/**', games.handle)
    page = ctx.new_page()
    if errors is not None:
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(str(e)))
    return page

def back(page):
    """Back from a game: the shelf returns with the box you left still open. Close it."""
    page.go_back(); page.wait_for_selector('.box')
    page.wait_for_selector('#box[open]', timeout=3000)
    page.keyboard.press('Escape')
    page.wait_for_selector('#box:not([open])', state='attached')

def main():
    srv, base = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])

        # ---- the shelf, on a computer
        games, errors = Games(), []
        page = new_page(browser, games, errors=errors)
        page.goto(base); page.wait_for_load_state('networkidle')
        page.evaluate('document.fonts.ready')
        n = page.locator('.box').count()
        listed = page.evaluate('GAMES.length')
        check('every game in games.js has a box (%d)' % listed, n == listed and n >= 8, n)
        html = (PUB / 'index.html').read_text()
        missing = [g for g in page.evaluate('GAMES.map(g => g.url)') if g not in html]
        check('every game is also in the no-JavaScript list', missing == [], missing)
        check('version matches in hub.js, package.json and index.html', page.inner_text('#ver') == __import__('json').loads((ROOT / 'package.json').read_text())['version'] and html.count('?v=' + page.inner_text('#ver')) == 3)
        check('every box picture loaded', page.evaluate("[...document.querySelectorAll('.box img')].every(i => i.complete && i.naturalWidth > 0)"))
        check('fonts loaded', page.evaluate("['800 20px Bricolage','20px Anton','800 20px Cinzel','20px \"Lilita One\"','20px \"Germania One\"'].every(f => document.fonts.check(f))"))
        check('no box name is clipped', page.evaluate("[...document.querySelectorAll('.box')].every(b => b.scrollHeight <= b.clientHeight + 1 && b.scrollWidth <= b.clientWidth + 1) && [...document.querySelectorAll('.box .name')].every(n => n.scrollWidth <= n.clientWidth + 1)"))
        check('nothing woken just by visiting', sum(games.knocks.values()) == 0, games.knocks)
        check('page does not scroll sideways', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        page.screenshot(path=str(SHOTS / 'desktop.png'), full_page=True)

        # ---- an awake game opens straight away, on the TV page
        page.locator('.box', has_text='Friend Feud').click()
        page.wait_for_selector('#status[data-state="ready"]', timeout=3000)
        check('awake game says ready', page.inner_text('#status-text') == 'Awake and ready')
        check('address ends in #feud', page.url.endswith('#feud'))
        check('computer: main button is the big screen', page.text_content('#act-main') == 'Put it on this screen')
        page.wait_for_timeout(350); page.screenshot(path=str(SHOTS / 'desktop-box.png'))
        page.click('#act-main'); page.wait_for_selector('#landed')
        check('lands on the game\'s TV page', page.inner_text('#landed') == 'feudnight.onrender.com/tv', page.inner_text('#landed'))
        page.go_back(); page.wait_for_selector('#box[open]')
        check('back button returns to the shelf with that box open', page.locator('.box').count() == n and page.inner_text('#box-name') == 'Friend Feud')
        check('…and it is on the box, not a stale waiting screen', page.is_visible('#view-info'))
        page.keyboard.press('Escape')

        # ---- only the opened game is woken
        check('only Feud was knocked on', set(games.knocks) == {'feudnight.onrender.com'}, games.knocks)

        # ---- an asleep game: waiting screen, then it opens by itself
        games.mode['clue-4fcu.onrender.com'] = ('asleep', 6)
        page.locator('.box', has_text='Friend Clue').click()
        page.wait_for_selector('#status[data-state="waking"]', timeout=4000)
        check('asleep game says waking', 'Waking it up' in page.inner_text('#status-text'))
        page.click('#act-other')
        page.wait_for_selector('#view-wait:not([hidden])')
        check('waiting screen names the game', page.text_content('#wait-head') == 'Setting up Friend Clue', page.text_content('#wait-head'))
        page.screenshot(path=str(SHOTS / 'desktop-waiting.png'))
        page.wait_for_selector('#landed', timeout=15000)
        check('opens by itself once up, on the player page', page.inner_text('#landed') == 'clue-4fcu.onrender.com/', page.inner_text('#landed'))
        check('kept knocking while it was asleep', games.knocks['clue-4fcu.onrender.com'] >= 3, games.knocks)
        back(page)

        # ---- a game that holds the request while it starts
        games.mode['bingo-9asx.onrender.com'] = 'held'
        page.locator('.box', has_text='Friend Bingo').click()
        page.click('#act-main')
        page.wait_for_selector('#view-wait:not([hidden])')
        page.wait_for_timeout(3000)
        check('still waiting while the request is held', page.is_visible('#view-wait') and page.locator('#landed').count() == 0)
        games.release()
        page.wait_for_selector('#landed', timeout=5000)
        check('slow-to-answer game opens when it answers', page.inner_text('#landed') == 'bingo-9asx.onrender.com/tv')
        check('one knock was enough', games.knocks['bingo-9asx.onrender.com'] == 1, games.knocks)
        games.mode['bingo-9asx.onrender.com'] = 'awake'
        back(page)

        # ---- cancel, and closing the box stops the knocking
        games.mode['friend-monopoly.onrender.com'] = 'dead'
        page.locator('.box', has_text='Friend Monopoly').click()
        page.click('#act-main'); page.wait_for_selector('#view-wait:not([hidden])')
        page.click('#wait-cancel')
        check('cancel goes back to the box', page.is_visible('#view-info') and not page.is_visible('#view-wait'))
        page.keyboard.press('Escape')
        check('Escape closes the box', not page.evaluate("document.getElementById('box').open"))
        page.wait_for_timeout(100); href = page.evaluate('location.href'); check('address has no # after closing', '#' not in href, href)
        before = games.knocks.get('friend-monopoly.onrender.com', 0); time.sleep(3.5)
        check('closing the box stops the knocking', games.knocks.get('friend-monopoly.onrender.com', 0) == before)
        check('no errors on the page', [e for e in errors if 'onrender.com' not in e and '502' not in e] == [], errors)
        page.context.close()

        # ---- a dead game: says so, offers a way through (clock run fast)
        games = Games(); games.mode['friend-jeopardy.onrender.com'] = 'dead'
        page = new_page(browser, games)
        page.clock.install()
        games.mode['friend-jeopardy.onrender.com'] = 'held'
        t0 = time.time(); page.goto(base + '#jeopardy'); took = time.time() - t0
        page.wait_for_selector('#box[open]')
        check('a sleeping game does not hold up the page loading', took < 5, took)
        games.mode['friend-jeopardy.onrender.com'] = 'dead'; games.release_bad()
        check('…/#jeopardy opens that box', page.inner_text('#box-name') == 'Friend Jeopardy')
        check('the box header is one tidy row', page.evaluate("(() => { const a = document.getElementById('box-art').getBoundingClientRect(), s = document.querySelector('.shut').getBoundingClientRect(), h = document.getElementById('box-name').getBoundingClientRect(); return s.left > h.left && h.left > a.left && s.top < a.bottom; })()"))
        page.click('#act-main')
        page.clock.run_for(13000)
        check('"Open it anyway" appears after a while', page.is_visible('#wait-anyway'))
        check('…and points at the TV page', page.get_attribute('#wait-anyway', 'href') == 'https://friend-jeopardy.onrender.com/tv')
        page.clock.run_for(140000)
        check('gives up after 2½ minutes and says so', 'taking longer than usual' in page.text_content('#wait-head'), page.text_content('#wait-head'))
        page.screenshot(path=str(SHOTS / 'desktop-stuck.png'))
        page.context.close()

        # ---- on a phone
        games = Games()
        page = new_page(browser, games, phone=True)
        page.goto(base); page.wait_for_load_state('networkidle'); page.evaluate('document.fonts.ready')
        check('phone: page does not scroll sideways', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        check('phone: no box name is clipped', page.evaluate("[...document.querySelectorAll('.box')].every(b => b.scrollHeight <= b.clientHeight + 1 && b.scrollWidth <= b.clientWidth + 1) && [...document.querySelectorAll('.box .name')].every(n => n.scrollWidth <= n.clientWidth + 1)"))
        page.screenshot(path=str(SHOTS / 'phone.png'), full_page=True)
        page.locator('.box', has_text='Settlers of Friends').tap()
        page.wait_for_selector('#status[data-state="ready"]')
        check('phone: main button plays on the phone', page.text_content('#act-main') == 'Play on this phone', page.text_content('#act-main'))
        check('phone: the box fits the screen', page.evaluate("(() => { const r = document.getElementById('box').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })()"))
        page.wait_for_timeout(350); page.screenshot(path=str(SHOTS / 'phone-box.png'))
        page.tap('#act-main'); page.wait_for_selector('#landed')
        check('phone: lands on the player page', page.inner_text('#landed') == 'settlers-of-friends.onrender.com/', page.inner_text('#landed'))
        back(page)
        page.locator('.box', has_text='Friend Wheel').tap()
        check('phone: a TV game says "Join on this phone"', page.text_content('#act-main') == 'Join on this phone')
        page.context.close()
        browser.close()
    srv.shutdown()
    bad = results.count(False)
    print('\n%d checks, %d failed' % (len(results), bad))
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    main()
