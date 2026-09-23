// Continuity monitor, injected by the harness via {eval} (strip the // lines first). Per frame it measures the jump of
// the chart position cPath (c before the beat-kick blend — the kick is a declared jump-cut with a w=9 spring back)
// normalised by the active chart's scale (baby size). Legal cuts: pathCut<=2, a kick just rose, or the mode changed.
// A *violation* is a spike: d>0.06 and d>2.5x the previous frame's motion — a discontinuity, not fast spring motion.
// Smooth fast frames (d>0.06 but ramping) are counted in MON.fast; v3 produces those in EXT right after drops.
// The 0.3 s after a mode change is legal too: the exterior springs launch fastest on their first frames (v3 identical).
window.MON={viol:[],fast:0,max:0,n:0};(function(){let pc=null,pk=0,pm='',pd=0,tm=-9;function f(){const N=CARD.NAV||CARD.home,c=[N.cPath[0],N.cPath[1]],sc=N.baby?N.baby.size:1,t=performance.now();
if(pc){if(N.mode!==pm)tm=t;const d=Math.hypot(c[0]-pc[0],c[1]-pc[1])/sc,legal=N.pathCut<=2||N.kick.x>pk+0.05||N.mode!==pm||t-tm<300;MON.n++;
if(!legal){MON.max=Math.max(MON.max,d);if(d>0.06){if(d>2.5*pd+0.01)MON.viol.push([performance.now()|0,+d.toFixed(3),+pd.toFixed(3),N.mode,!!N.baby]);else MON.fast++;}}pd=d;}
pc=c;pk=N.kick.x;pm=N.mode;requestAnimationFrame(f);}f();})()
