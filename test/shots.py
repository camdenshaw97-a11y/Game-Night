import sys, pathlib
from playwright.sync_api import sync_playwright
root = pathlib.Path(sys.argv[1]).resolve(); out = pathlib.Path(sys.argv[2]); out.mkdir(exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for s in (180, 192, 512):
        pg = b.new_page(viewport={'width': s, 'height': s})
        pg.goto((root / 'icon.svg').as_uri()); pg.screenshot(path=str(root / f'icon-{s}.png')); pg.close()
    b.close()
