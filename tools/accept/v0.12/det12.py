#!/usr/bin/env python3
# MAXWELL trace on a real track (headed, tab capture), v0.12: det11.py's 2 s / 80 s D lines (energy / train / probe / the MS
# fields / the dominant plane hue from hooks.mxcol()) plus what v0.12 is about — the LAUNCHES:
#   lau      = hooks.launches() (read-only; shape: {n, perBand:{kick,snare,hat,onset,note}, last:[{band,sector,hue,amp,step}], medium})
#   dn       = launches since the previous D line (n differenced across samples; the first sample after RESUME differences
#              against the paused-window read, so it counts the launches of the first 2 s of play)
#   dpb      = the same per band
#   onsets   = the engine's onsets over the same 2 s, estimated as onsetRate × 2 (onsetRate = Σonsets·exp(-dt/1), hits/s) —
#              the plan's gate: dn vs onsets within 30 % (read the ratio `lr` = dn / onsets; null when onsets < 1)
#   kickhue  = the hue of the newest kick launch in `last` (the bass note at that kick, argmax bchroma, or the anchor)
#   dkick    = circular distance in turns between `dom` (the plane's dominant hue along the +x ray beyond r = 8 cells) and
#              kickhue — the plan's per-note gate: ≤ 0.08 on ≥ 70 % of samples
#   bk/bhue  = argmax(bchroma) now and its sector hue. `bk` is a PITCH CLASS and mxcol().hues is indexed by SECTOR, and a
#              pitch class pc sits at sector (7 pc) mod 12 (assets/math/keycolour.js sectorPc is its inverse: 7·7 = 1 mod 12),
#              so the hue is hues[(7·bk) mod 12] — hues[bk] compared a hue against the wrong note. (Fixed by the MAXWELL3
#              worker to match the scale hooks.launches() reports `hue` on; the line's own comment already said "sector hue".)
#              dbass = dist(dom, bhue) — the same question asked of
#              the bass note sounding NOW rather than at the last kick (a kick's hue is held in the field for ~a ring's life)
#   medium   = the geometry in force (0 lens, 1 cavity, 3 waveguide — 2 must never appear)
# A double-time passage: read `onsets` doubling along the trace and `dn` doubling with it — the AUDIT lists the samples.
# A PAUSED START matching audit12.sh is inserted after the keys land: pause the media tab, 8 s, one D line preceded by the
# marker PAUSED8S (its dn is the launches during silence — the item-A gate on a real track: 0), 2 s more, .play(), marker
# RESUME, then the 40 x 2 s play loop. Do NOT pipe this script into `head` (SIGPIPE kills the run).
# usage: det12.py <track> <tag>   -> prints D {...} lines. <track> is a file in $MUSIC (default ~/Music/RetinaRave), with
#        or without its extension (.flac .wav .mp3 .m4a .opus .ogg tried in that order) — the same rule as audit12.sh.
import json, os, subprocess, sys, datetime
MUSIC = os.environ.get('MUSIC') or os.path.expanduser('~/Music/RetinaRave')
track, tag = sys.argv[1], sys.argv[2]
def resolve(name):
    if os.path.isfile(os.path.join(MUSIC, name)): return os.path.join(MUSIC, name)
    for e in ('flac', 'wav', 'mp3', 'm4a', 'opus', 'ogg'):
        f = os.path.join(MUSIC, f'{name}.{e}')
        if os.path.isfile(f): return f
    return None
FILE = resolve(track) or resolve(os.path.splitext(track)[0])
if not FILE: sys.exit(f'det12: no {track} in {MUSIC} (tried .flac .wav .mp3 .m4a .opus .ogg)')
track = os.path.splitext(track)[0]
INFO = ("(()=>{const h=CARD.REG[9].scene.hooks,S=CARD.MS;const J=(f)=>{try{const v=f();return typeof v==='string'?JSON.parse(v):v}catch(e){return String(e)}};"
        "const g=(k)=>(S[k]!==undefined&&S[k]!==null&&isFinite(+S[k])?+(+S[k]).toFixed(2):null);"
        "const lit=(S.chroma?Array.from(S.chroma).reduce((a,x,i)=>{if(x>0.3)a.push(i);return a},[]):null);"
        "const mc=J(()=>h.mxcol?h.mxcol():null);const lau=J(()=>h.launches?h.launches():null);"
        "const CM=(a)=>{let x=0,y=0,w=0;for(const p of a){if(!(p[0]>1e-9))continue;x+=p[0]*Math.cos(6.283185307*p[1]);y+=p[0]*Math.sin(6.283185307*p[1]);w+=p[0];}"
        "return w>0?{h:+(((Math.atan2(y,x)/6.283185307)%1+1)%1).toFixed(4),w:+w.toFixed(4),r:+(Math.hypot(x,y)/w).toFixed(3)}:null};"
        "const DH=(a,b)=>{if(a==null||b==null)return null;const d=Math.abs(a-b)%1;return +Math.min(d,1-d).toFixed(4)};"
        "let dom=null,wmax=null,bk=null,bhue=null,kickhue=null,dn=null,dpb=null;"
        "if(mc&&mc.ray&&mc.ray.length){dom=CM(mc.ray.filter(p=>p[0]>=8).map(p=>[p[1],p[2]]));wmax=+Math.max.apply(null,mc.ray.map(p=>p[1])).toFixed(4);}"
        "if(S.bchroma&&mc&&mc.hues){bk=0;for(let i=1;i<12;i++)if(S.bchroma[i]>S.bchroma[bk])bk=i;bhue=mc.hues[(7*bk)%12];}"
        "if(lau&&lau.last){for(let i=lau.last.length-1;i>=0;i--)if(lau.last[i].band==='kick'){kickhue=lau.last[i].hue;break;}}"
        "if(lau&&typeof lau.n==='number'){const p=window.__L0||null;dn=p?lau.n-p.n:null;"
        "if(p&&lau.perBand&&p.perBand){dpb={};for(const k in lau.perBand)dpb[k]=lau.perBand[k]-(p.perBand[k]||0);}"
        "window.__L0={n:lau.n,perBand:Object.assign({},lau.perBand||{})};}"
        "const onsets=(S.onsetRate!=null&&isFinite(+S.onsetRate))?+(2*S.onsetRate).toFixed(2):null;"
        "return 'D '+JSON.stringify({t:+(performance.now()/1000).toFixed(1),au:CARD.ENGINE.AU.mode,bpm:+S.bpm.toFixed(1),bc:+(S.beatCount+S.beatPhase).toFixed(2),"
        "bass:+S.bass.toFixed(2),kick:+S.kick.toFixed(2),snare:+S.snare.toFixed(2),hat:+S.hat.toFixed(2),key:S.key,mode:S.mode,kc:+S.keyConf.toFixed(2),"
        "chroma:S.chroma?Array.from(S.chroma).map(x=>+x.toFixed(2)):null,bchroma:S.bchroma?Array.from(S.bchroma).map(x=>+x.toFixed(2)):null,lit:lit,arc:S.arc,alt:S.sectionAlt,build:+S.build.toFixed(2),drop:+S.dropEnv.toFixed(2),q:CARD.Q.q,ms:+CARD.ENGINE.ms.toFixed(2),"
        "onsetRate:g('onsetRate'),kickCount:g('kickCount'),onsets:onsets,dn:dn,dpb:dpb,lr:(onsets!=null&&onsets>=1&&dn!=null)?+(dn/onsets).toFixed(2):null,"
        "dom:dom,wmax:wmax,kickhue:kickhue,dkick:DH(dom&&dom.h,kickhue),bk:bk,bhue:bhue,dbass:DH(dom&&dom.h,bhue),medium:lau?lau.medium:null,"
        "lau:lau?{n:lau.n,perBand:lau.perBand,last:(lau.last||[]).slice(-4)}:null,"
        "presence:g('presence'),alive:g('alive'),absentT:g('absentT'),centroid:g('centroid'),dirty:g('dirty'),punchy:g('punchy'),"
        "energy:J(()=>h.energy()),train:J(()=>h.train()),probe:J(()=>h.probe()),hud:CARD.REG[9].scene.hud?CARD.REG[9].scene.hud():''})})()")
steps = [{"until": "window.CARD"}, {"wait": 1000},
         {"tab": f"file://{FILE}", "window": {"left": 2000, "top": 100, "width": 640, "height": 360}}, {"wait": 2000},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');return 'TAB '+location.href+' '+(v?[v.paused,+v.currentTime.toFixed(1)]:'none')})()"},
         {"activate": "main"}, {"wait": 500}, {"clickSel": "#go"}, {"wait": 6000}, {"key": "9"}, {"key": "n"}, {"wait": 1500},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');if(v)v.pause();return 'PAUSED '+(v?v.paused:'none')})()"},
         {"wait": 2000}, {"eval": INFO}, {"wait": 6000}, {"eval": "'PAUSED8S'"}, {"eval": INFO}, {"wait": 2000},
         {"evalTab": "(()=>{const v=document.querySelector('video,audio');if(v)v.play();return 'RESUME '+(v?v.paused:'none')})()"}]
for i in range(40): steps += [{"eval": INFO}, {"wait": 2000}]
steps.append({"eval": "JSON.stringify({errs:CARD.ERRS,bad:CARD.nonFinite(),au:CARD.ENGINE.AU.mode,scene:CARD.SC.logical})"})
print(f"### det {tag} {track} {datetime.datetime.now():%H:%M:%S}", flush=True)
env = dict(os.environ, HEADED='1', WIN='1920,1080', WINPOS='0,0', CAPTITLE=track, GPU='1', OUT='tools/accept/v0.12', PORT=os.environ.get('PORT', '8840'))
p = subprocess.run(['node', 'tools/cdp.js', 'real', json.dumps(steps)], cwd='/home/toma/Documents/Kraftek/RetinaRave', env=env, capture_output=True, text=True)
for l in (p.stdout + p.stderr).split('\n'):
    if l.startswith('EVAL'):
        v = l.split('=> ', 1)[1]
        try: v = json.loads(v)
        except Exception: pass
        print(v if isinstance(v, str) else json.dumps(v), flush=True)
    elif '[EXC]' in l or 'TIMEOUT' in l: print(l[:300], flush=True)
print(f"### end {datetime.datetime.now():%H:%M:%S}", flush=True)
