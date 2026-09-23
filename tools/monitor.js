// Continuity monitor, injected by the harness via {eval} (strip the // lines first). Per frame it measures the jump of
// c normalised by the active chart's scale (baby size). Legal cuts: pathCut<=2, a kick just rose, or the mode changed.
// A *violation* is a spike: d>0.06 and d>2.5x the previous frame's motion — a discontinuity, not fast spring motion.
// Smooth fast frames (d>0.06 but ramping) are counted in MON.fast; v3 produces those in EXT right after drops.
window.MON={viol:[],fast:0,max:0,n:0};(function(){let pc=null,pk=0,pm='',pd=0;function f(){const N=CARD.NAV||CARD.home,c=[N.c[0],N.c[1]],sc=N.baby?N.baby.size:1;
if(pc){const d=Math.hypot(c[0]-pc[0],c[1]-pc[1])/sc,legal=N.pathCut<=2||N.kick.x>pk+0.05||N.mode!==pm;MON.n++;
if(!legal){MON.max=Math.max(MON.max,d);if(d>0.06){if(d>2.5*pd+0.01)MON.viol.push([performance.now()|0,+d.toFixed(3),+pd.toFixed(3),N.mode,!!N.baby]);else MON.fast++;}}pd=legal?0:d;}
pc=c;pk=N.kick.x;pm=N.mode;requestAnimationFrame(f);}f();})()
