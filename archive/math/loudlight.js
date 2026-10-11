// Archive shim (DECISIONS §118, the lean-down): the archived scenes under archive/scenes/ import '../../math/loudlight.js'.
// That module is still LIVE — a kept scene uses it — so this file only re-exports it, keeping the archive importable
// (tools/test_nav2.js reads archive/scenes/nav/ as its A/B control). The three modules only the archived scenes used
// (nudge, gielis, chladni) are real files here.
export * from '../../assets/math/loudlight.js';
