import json, os, subprocess, sys
src = open('tools/accept/v0.12/det12.py').read()
sys.argv = ['det12.py', 'SeeYouDrop', 'x']
exec(src.split('steps = [')[0])          # gives FILE, INFO
OUT = os.environ['OUT']; T0 = int(os.environ.get('T0', '46')); N = int(os.environ.get('N', '16'))
CT = "(()=>{const v=document.querySelector('video,audio');return +v.currentTime.toFixed(2)})()"
steps = [{"until": "window.CARD"}, {"wait": 1000},
         {"tab": f"file://{FILE}", "window": {"left": 2000, "top": 100, "width": 640, "height": 360}}, {"wait": 2000},
         {"activate": "main"}, {"wait": 500}, {"clickSel": "#go"}, {"wait": 6000}, {"key": "9"}, {"key": "n"}, {"wait": 1000},
         {"evalTab": f"(()=>{{const v=document.querySelector('video,audio');v.currentTime={T0};return v.currentTime}})()"}, {"wait": 1500}]
for i in range(N):
    steps += [{"evalTab": CT}, {"eval": INFO}, {"shot": f"syd-w{i:02d}"}, {"wait": 1000}]
steps.append({"eval": "JSON.stringify({errs:CARD.ERRS,au:CARD.ENGINE.AU.mode,scene:CARD.SC.logical})"})
env = dict(os.environ, HEADED='1', WIN='1920,1080', WINPOS='0,0', CAPTITLE='SeeYouDrop', GPU='1', PORT=os.environ.get('PORT', '8841'))
p = subprocess.run(['node', 'tools/cdp.js', 'real', json.dumps(steps)], env=env, capture_output=True, text=True)
for l in p.stdout.splitlines():
    if l.startswith('[console'): continue
    print(l)
print(p.stderr[-800:])
