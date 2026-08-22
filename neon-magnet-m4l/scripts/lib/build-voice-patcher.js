'use strict';

var B = require('./patcher-builder');

function lineControl(doc, sourceId, sourceOutlet, id, x, y, initial, smoothing) {
  B.message(doc, id + '-msg', '$1 ' + (smoothing || 20), x, y, 54);
  B.object(doc, id, 'line~ ' + initial, x + 65, y, 72);
  B.connect(doc, sourceId, sourceOutlet, id + '-msg', 0);
  B.connect(doc, id + '-msg', 0, id, 0);
}

function buildVoicePatcher() {
  var doc = B.document({ rect: [0, 0, 1180, 720] });
  var selectors = 'route saw pulse sub noise pwm cutoff resonance env_amount attack decay sustain release';

  B.object(doc, 'voice-in', 'in 1', 35, 35, 50);
  B.object(doc, 'voice-route', selectors, 110, 35, 720);
  B.connect(doc, 'voice-in', 0, 'voice-route', 0);

  lineControl(doc, 'voice-route', 0, 'saw-level', 110, 82, 0.72, 20);
  lineControl(doc, 'voice-route', 1, 'pulse-level', 110, 112, 0.35, 20);
  lineControl(doc, 'voice-route', 2, 'sub-level', 110, 142, 0.28, 20);
  lineControl(doc, 'voice-route', 3, 'noise-level', 110, 172, 0.015, 20);
  lineControl(doc, 'voice-route', 4, 'pwm-value', 110, 202, 0.5, 35);
  lineControl(doc, 'voice-route', 5, 'cutoff-value', 110, 232, 2400, 30);
  lineControl(doc, 'voice-route', 6, 'resonance-value', 110, 262, 1.8, 30);
  lineControl(doc, 'voice-route', 7, 'env-value', 110, 292, 0.38, 30);

  B.object(doc, 'note-unpack', 'unpack 0 0', 870, 35, 86);
  B.connect(doc, 'voice-route', 12, 'note-unpack', 0);
  B.object(doc, 'pitch-mtof', 'mtof', 870, 72, 48);
  B.object(doc, 'pitch-sig', 'sig~ 440', 870, 105, 64);
  B.connect(doc, 'note-unpack', 0, 'pitch-mtof', 0);
  B.connect(doc, 'pitch-mtof', 0, 'pitch-sig', 0);

  B.object(doc, 'velocity-scale', '/ 127.', 970, 72, 54);
  B.object(doc, 'velocity-sig', 'sig~ 0', 970, 105, 58);
  B.connect(doc, 'note-unpack', 1, 'velocity-scale', 0);
  B.connect(doc, 'velocity-scale', 0, 'velocity-sig', 0);

  B.object(doc, 'osc-saw', 'saw~', 450, 110, 54);
  B.connect(doc, 'pitch-sig', 0, 'osc-saw', 0);
  B.object(doc, 'osc-saw-gain', '*~', 520, 110, 38);
  B.connect(doc, 'osc-saw', 0, 'osc-saw-gain', 0);
  B.connect(doc, 'saw-level', 0, 'osc-saw-gain', 1);

  B.object(doc, 'osc-phasor', 'phasor~', 450, 155, 62);
  B.object(doc, 'osc-pulse-compare', '>~', 520, 155, 38);
  B.object(doc, 'osc-pulse-scale', '*~ 2.', 570, 155, 50);
  B.object(doc, 'osc-pulse-offset', '-~ 1.', 630, 155, 50);
  B.object(doc, 'osc-pulse-gain', '*~', 690, 155, 38);
  B.connect(doc, 'pitch-sig', 0, 'osc-phasor', 0);
  B.connect(doc, 'osc-phasor', 0, 'osc-pulse-compare', 0);
  B.connect(doc, 'pwm-value', 0, 'osc-pulse-compare', 1);
  B.connect(doc, 'osc-pulse-compare', 0, 'osc-pulse-scale', 0);
  B.connect(doc, 'osc-pulse-scale', 0, 'osc-pulse-offset', 0);
  B.connect(doc, 'osc-pulse-offset', 0, 'osc-pulse-gain', 0);
  B.connect(doc, 'pulse-level', 0, 'osc-pulse-gain', 1);

  B.object(doc, 'sub-half', '*~ 0.5', 450, 200, 60);
  B.object(doc, 'osc-sub', 'cycle~', 520, 200, 58);
  B.object(doc, 'osc-sub-gain', '*~', 590, 200, 38);
  B.connect(doc, 'pitch-sig', 0, 'sub-half', 0);
  B.connect(doc, 'sub-half', 0, 'osc-sub', 0);
  B.connect(doc, 'osc-sub', 0, 'osc-sub-gain', 0);
  B.connect(doc, 'sub-level', 0, 'osc-sub-gain', 1);

  B.object(doc, 'osc-noise', 'noise~', 450, 245, 58);
  B.object(doc, 'osc-noise-gain', '*~', 520, 245, 38);
  B.connect(doc, 'osc-noise', 0, 'osc-noise-gain', 0);
  B.connect(doc, 'noise-level', 0, 'osc-noise-gain', 1);

  B.object(doc, 'mix-a', '+~', 760, 125, 38);
  B.object(doc, 'mix-b', '+~', 760, 185, 38);
  B.object(doc, 'mix-all', '+~', 820, 155, 38);
  B.object(doc, 'mix-headroom', '*~ 0.38', 870, 155, 62);
  B.connect(doc, 'osc-saw-gain', 0, 'mix-a', 0);
  B.connect(doc, 'osc-pulse-gain', 0, 'mix-a', 1);
  B.connect(doc, 'osc-sub-gain', 0, 'mix-b', 0);
  B.connect(doc, 'osc-noise-gain', 0, 'mix-b', 1);
  B.connect(doc, 'mix-a', 0, 'mix-all', 0);
  B.connect(doc, 'mix-b', 0, 'mix-all', 1);
  B.connect(doc, 'mix-all', 0, 'mix-headroom', 0);

  B.object(doc, 'voice-adsr', 'adsr~ 8 280 0.68 620', 520, 350, 168);
  B.connect(doc, 'velocity-sig', 0, 'voice-adsr', 0);
  B.connect(doc, 'voice-route', 8, 'voice-adsr', 1);
  B.connect(doc, 'voice-route', 9, 'voice-adsr', 2);
  B.connect(doc, 'voice-route', 10, 'voice-adsr', 3);
  B.connect(doc, 'voice-route', 11, 'voice-adsr', 4);

  B.object(doc, 'env-depth', '*~ 8000.', 700, 350, 72);
  B.object(doc, 'env-scaled', '*~', 785, 350, 38);
  B.object(doc, 'filter-cutoff', '+~', 840, 350, 38);
  B.connect(doc, 'voice-adsr', 0, 'env-depth', 0);
  B.connect(doc, 'env-depth', 0, 'env-scaled', 0);
  B.connect(doc, 'env-value', 0, 'env-scaled', 1);
  B.connect(doc, 'cutoff-value', 0, 'filter-cutoff', 0);
  B.connect(doc, 'env-scaled', 0, 'filter-cutoff', 1);

  B.object(doc, 'voice-filter', 'svf~ 2400 1.8', 700, 410, 106);
  B.connect(doc, 'mix-headroom', 0, 'voice-filter', 0);
  B.connect(doc, 'filter-cutoff', 0, 'voice-filter', 1);
  B.connect(doc, 'resonance-value', 0, 'voice-filter', 2);

  B.object(doc, 'voice-amp', '*~', 840, 410, 38);
  B.object(doc, 'voice-limit', 'tanh~', 895, 410, 50);
  B.connect(doc, 'voice-filter', 0, 'voice-amp', 0);
  B.connect(doc, 'voice-adsr', 0, 'voice-amp', 1);
  B.connect(doc, 'voice-amp', 0, 'voice-limit', 0);

  B.object(doc, 'voice-thispoly', 'thispoly~', 520, 430, 72);
  B.connect(doc, 'voice-adsr', 0, 'voice-thispoly', 0);
  B.object(doc, 'voice-out-left', 'out~ 1', 840, 475, 52);
  B.object(doc, 'voice-out-right', 'out~ 2', 910, 475, 52);
  B.connect(doc, 'voice-limit', 0, 'voice-out-left', 0);
  B.connect(doc, 'voice-limit', 0, 'voice-out-right', 0);

  B.comment(doc, 'voice-note', 'Neon Magnet voice: oscillator mix → envelope-modulated low-pass → ADSR. The envelope signal keeps thispoly~ busy through release.', 370, 560, 700, 12, false);
  return doc;
}

module.exports = buildVoicePatcher;
