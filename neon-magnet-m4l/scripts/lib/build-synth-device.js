'use strict';

var B = require('./patcher-builder');

function prependControl(doc, controlId, id, selector, x, y, outlet) {
  B.object(doc, id, 'prepend ' + selector, x, y, 112);
  B.connect(doc, controlId, outlet || 0, id, 0);
  B.connect(doc, id, 0, 'synth-js', 0);
}

function menuControl(doc, id, name, items, x, y, width, selector, initial) {
  B.menu(doc, id, name, items, x, y, width, initial || 0);
  prependControl(doc, id, id + '-prepend', selector, x, y + 32, 1);
}

function lineFromRoute(doc, routeId, outlet, id, x, y, expression, initial) {
  var source = routeId;
  if (expression) {
    B.object(doc, id + '-expr', expression, x, y, 116);
    B.connect(doc, routeId, outlet, id + '-expr', 0);
    source = id + '-expr';
    x += 128;
  }
  B.message(doc, id + '-msg', '$1 30', x, y, 52);
  B.object(doc, id, 'line~ ' + initial, x + 62, y, 70);
  B.connect(doc, source, expression ? 0 : outlet, id + '-msg', 0);
  B.connect(doc, id + '-msg', 0, id, 0);
}

function buildSynthDevice() {
  var doc = B.document({ amxdtype: 1768515945, rect: [0, 0, 1740, 900] });

  B.comment(doc, 'title', 'NEON MAGNET — POLYSYNTH', 18, 12, 430, 17, true);
  B.comment(doc, 'subtitle', 'Eight voices · analog-style oscillator mix · magnetic nostalgia', 18, 38, 500, 11, false);
  B.object(doc, 'synth-js', 'js code/neon_magnet_synth.js', 780, 390, 220);

  B.comment(doc, 'osc-title', 'OSCILLATORS', 20, 76, 160, 14, true);
  B.dial(doc, 'saw', 'Saw', 20, 106, 0, 1, 0.72, 1);
  B.dial(doc, 'pulse', 'Pulse', 82, 106, 0, 1, 0.35, 1);
  B.dial(doc, 'sub', 'Sub', 144, 106, 0, 1, 0.28, 1);
  B.dial(doc, 'noise', 'Noise', 206, 106, 0, 0.2, 0.015, 1);
  B.dial(doc, 'pwm', 'PWM', 268, 106, 0.08, 0.92, 0.5, 1);
  ['saw', 'pulse', 'sub', 'noise', 'pwm'].forEach(function (name, index) {
    B.comment(doc, name + '-label', name.toUpperCase(), 20 + index * 62, 157, 55, 10, true);
    prependControl(doc, name, name + '-prepend', name, 20 + index * 62, 182);
  });

  B.comment(doc, 'filter-title', 'FILTER + ENVELOPE', 354, 76, 220, 14, true);
  B.dial(doc, 'cutoff', 'Cutoff', 354, 106, 0, 1, 0.58, 1);
  B.dial(doc, 'resonance', 'Resonance', 416, 106, 0, 0.75, 0.22, 1);
  B.dial(doc, 'env-amount', 'Env Amount', 478, 106, 0, 1, 0.38, 1);
  B.comment(doc, 'cutoff-label', 'CUTOFF', 350, 157, 58, 10, true);
  B.comment(doc, 'res-label', 'RESO', 422, 157, 45, 10, true);
  B.comment(doc, 'env-label', 'ENV', 488, 157, 40, 10, true);
  prependControl(doc, 'cutoff', 'cutoff-prepend', 'cutoff', 354, 182);
  prependControl(doc, 'resonance', 'res-prepend', 'resonance', 416, 182);
  prependControl(doc, 'env-amount', 'env-prepend', 'env_amount', 478, 182);

  B.dial(doc, 'attack', 'Attack', 556, 106, 1, 5000, 8, 2);
  B.dial(doc, 'decay', 'Decay', 618, 106, 10, 7000, 280, 2);
  B.dial(doc, 'sustain', 'Sustain', 680, 106, 0, 1, 0.68, 1);
  B.dial(doc, 'release', 'Release', 742, 106, 20, 10000, 620, 2);
  ['attack', 'decay', 'sustain', 'release'].forEach(function (name, index) {
    B.comment(doc, name + '-label', name.toUpperCase(), 552 + index * 62, 157, 58, 10, true);
    prependControl(doc, name, name + '-prepend', name, 556 + index * 62, 182);
  });

  B.comment(doc, 'fx-title', 'COLOR + SPACE', 20, 270, 220, 14, true);
  B.dial(doc, 'drive', 'Drive', 20, 304, 0, 0.65, 0.18, 1);
  B.comment(doc, 'drive-label', 'DRIVE', 20, 355, 52, 10, true);
  prependControl(doc, 'drive', 'drive-prepend', 'drive', 20, 380);

  menuControl(doc, 'chorus-mode', 'Chorus Mode', ['off', ',', 'I', ',', 'II'], 90, 312, 86, 'chorus_mode', 2);
  B.comment(doc, 'chorus-mode-label', 'CHORUS', 90, 338, 64, 10, true);
  B.dial(doc, 'chorus-mix', 'Chorus Mix', 194, 304, 0, 0.75, 0.42, 1);
  B.comment(doc, 'chorus-mix-label', 'WIDTH', 194, 355, 52, 10, true);
  prependControl(doc, 'chorus-mix', 'chorus-mix-prepend', 'chorus_mix', 194, 380);

  menuControl(doc, 'delay-division', 'Delay Division', ['1/16', ',', '1/8', ',', '1/8D', ',', '1/4', ',', '1/4D', ',', '1/2'], 270, 312, 94, 'delay_division', 2);
  B.comment(doc, 'delay-div-label', 'DELAY', 270, 338, 52, 10, true);
  B.dial(doc, 'delay-feedback', 'Delay Feedback', 382, 304, 0, 0.7, 0.38, 1);
  B.dial(doc, 'delay-mix', 'Delay Mix', 444, 304, 0, 0.5, 0.18, 1);
  B.comment(doc, 'delay-feedback-label', 'FEEDBACK', 374, 355, 70, 10, true);
  B.comment(doc, 'delay-mix-label', 'MIX', 456, 355, 40, 10, true);
  prependControl(doc, 'delay-feedback', 'delay-feedback-prepend', 'delay_feedback', 382, 380);
  prependControl(doc, 'delay-mix', 'delay-mix-prepend', 'delay_mix', 444, 380);

  B.dial(doc, 'reverb-time', 'Reverb Time', 526, 304, 250, 10000, 2200, 2);
  B.dial(doc, 'reverb-damp', 'Reverb Damp', 588, 304, 0, 1, 0.52, 1);
  B.dial(doc, 'reverb-mix', 'Reverb Mix', 650, 304, 0, 0.58, 0.22, 1);
  B.comment(doc, 'reverb-time-label', 'TIME', 532, 355, 45, 10, true);
  B.comment(doc, 'reverb-damp-label', 'DAMP', 594, 355, 45, 10, true);
  B.comment(doc, 'reverb-mix-label', 'MIX', 664, 355, 38, 10, true);
  prependControl(doc, 'reverb-time', 'reverb-time-prepend', 'reverb_time', 526, 380);
  prependControl(doc, 'reverb-damp', 'reverb-damp-prepend', 'reverb_damp', 588, 380);
  prependControl(doc, 'reverb-mix', 'reverb-mix-prepend', 'reverb_mix', 650, 380);

  B.dial(doc, 'output', 'Output', 728, 304, 0, 1, 0.78, 1);
  B.comment(doc, 'output-label', 'OUTPUT', 724, 355, 60, 10, true);
  prependControl(doc, 'output', 'output-prepend', 'output', 728, 380);

  menuControl(doc, 'scene', 'Scene', ['auto', ',', 'neon_drive', ',', 'noir_rain', ',', 'french_electro', ',', 'midnight_signal'], 812, 312, 134, 'scene', 1);
  B.comment(doc, 'scene-label', 'SCENE', 812, 338, 52, 10, true);
  B.button(doc, 'surprise', 'SURPRISE ME', 964, 312, 118);
  B.message(doc, 'surprise-message', 'surprise auto 0.82', 964, 350, 124);
  B.connect(doc, 'surprise', 0, 'surprise-message', 0);
  B.connect(doc, 'surprise-message', 0, 'synth-js', 0);
  B.comment(doc, 'status', 'ready', 812, 376, 276, 11, false);
  B.connect(doc, 'synth-js', 2, 'status', 0);

  B.object(doc, 'notein', 'notein', 1130, 55, 58);
  B.object(doc, 'note-pack', 'pack 0 0', 1130, 90, 72);
  B.object(doc, 'midinote', 'prepend midinote', 1130, 125, 112);
  B.object(doc, 'voice-target', 'prepend target 0', 1280, 390, 116);
  B.object(doc, 'poly', 'poly~ neon_magnet_voice 8 @steal 1', 1130, 180, 246);
  B.connect(doc, 'notein', 0, 'note-pack', 0);
  B.connect(doc, 'notein', 1, 'note-pack', 1);
  B.connect(doc, 'note-pack', 0, 'midinote', 0);
  B.connect(doc, 'midinote', 0, 'poly', 0);
  B.connect(doc, 'synth-js', 0, 'voice-target', 0);
  B.connect(doc, 'voice-target', 0, 'poly', 0);

  B.object(doc, 'fx-route', 'route drive chorus_mode chorus_mix chorus_rate chorus_depth delay_time delay_feedback delay_mix reverb_time reverb_damp reverb_mix output', 780, 430, 820);
  B.connect(doc, 'synth-js', 1, 'fx-route', 0);

  lineFromRoute(doc, 'fx-route', 0, 'drive-gain', 780, 470, 'expr 1. + $f1 * 5.', 1.9);
  B.object(doc, 'drive-multiply-left', '*~', 1130, 250, 38);
  B.object(doc, 'drive-multiply-right', '*~', 1190, 250, 38);
  B.object(doc, 'drive-shape-left', 'tanh~', 1130, 286, 50);
  B.object(doc, 'drive-shape-right', 'tanh~', 1190, 286, 50);
  B.connect(doc, 'poly', 0, 'drive-multiply-left', 0);
  B.connect(doc, 'poly', 1, 'drive-multiply-right', 0);
  B.connect(doc, 'drive-gain', 0, 'drive-multiply-left', 1);
  B.connect(doc, 'drive-gain', 0, 'drive-multiply-right', 1);
  B.connect(doc, 'drive-multiply-left', 0, 'drive-shape-left', 0);
  B.connect(doc, 'drive-multiply-right', 0, 'drive-shape-right', 0);

  lineFromRoute(doc, 'fx-route', 2, 'chorus-wet', 780, 510, null, 0.42);
  lineFromRoute(doc, 'fx-route', 2, 'chorus-dry', 780, 550, 'expr 1. - $f1', 0.58);
  lineFromRoute(doc, 'fx-route', 3, 'chorus-rate', 780, 590, null, 0.92);
  lineFromRoute(doc, 'fx-route', 4, 'chorus-depth', 780, 630, null, 4.8);
  B.object(doc, 'chorus-lfo', 'cycle~ 0.92', 1110, 330, 82);
  B.object(doc, 'chorus-lfo-right', '*~ -1.', 1205, 330, 58);
  B.object(doc, 'chorus-mod-left', '*~', 1110, 365, 38);
  B.object(doc, 'chorus-mod-right', '*~', 1205, 365, 38);
  B.object(doc, 'chorus-base-left', '+~ 12.', 1110, 400, 58);
  B.object(doc, 'chorus-base-right', '+~ 12.', 1205, 400, 58);
  B.connect(doc, 'chorus-rate', 0, 'chorus-lfo', 0);
  B.connect(doc, 'chorus-lfo', 0, 'chorus-lfo-right', 0);
  B.connect(doc, 'chorus-lfo', 0, 'chorus-mod-left', 0);
  B.connect(doc, 'chorus-lfo-right', 0, 'chorus-mod-right', 0);
  B.connect(doc, 'chorus-depth', 0, 'chorus-mod-left', 1);
  B.connect(doc, 'chorus-depth', 0, 'chorus-mod-right', 1);
  B.connect(doc, 'chorus-mod-left', 0, 'chorus-base-left', 0);
  B.connect(doc, 'chorus-mod-right', 0, 'chorus-base-right', 0);

  B.object(doc, 'chorus-tapin-left', 'tapin~ 100', 1320, 250, 76);
  B.object(doc, 'chorus-tapout-left', 'tapout~ 12', 1320, 286, 82);
  B.object(doc, 'chorus-tapin-right', 'tapin~ 100', 1415, 250, 76);
  B.object(doc, 'chorus-tapout-right', 'tapout~ 12', 1415, 286, 82);
  B.connect(doc, 'drive-shape-left', 0, 'chorus-tapin-left', 0);
  B.connect(doc, 'chorus-tapin-left', 0, 'chorus-tapout-left', 0);
  B.connect(doc, 'chorus-base-left', 0, 'chorus-tapout-left', 1);
  B.connect(doc, 'drive-shape-right', 0, 'chorus-tapin-right', 0);
  B.connect(doc, 'chorus-tapin-right', 0, 'chorus-tapout-right', 0);
  B.connect(doc, 'chorus-base-right', 0, 'chorus-tapout-right', 1);

  B.object(doc, 'chorus-dry-left', '*~', 1320, 330, 38);
  B.object(doc, 'chorus-wet-left', '*~', 1370, 330, 38);
  B.object(doc, 'chorus-sum-left', '+~', 1420, 330, 38);
  B.object(doc, 'chorus-dry-right', '*~', 1320, 370, 38);
  B.object(doc, 'chorus-wet-right', '*~', 1370, 370, 38);
  B.object(doc, 'chorus-sum-right', '+~', 1420, 370, 38);
  B.connect(doc, 'drive-shape-left', 0, 'chorus-dry-left', 0);
  B.connect(doc, 'chorus-dry', 0, 'chorus-dry-left', 1);
  B.connect(doc, 'chorus-tapout-left', 0, 'chorus-wet-left', 0);
  B.connect(doc, 'chorus-wet', 0, 'chorus-wet-left', 1);
  B.connect(doc, 'chorus-dry-left', 0, 'chorus-sum-left', 0);
  B.connect(doc, 'chorus-wet-left', 0, 'chorus-sum-left', 1);
  B.connect(doc, 'drive-shape-right', 0, 'chorus-dry-right', 0);
  B.connect(doc, 'chorus-dry', 0, 'chorus-dry-right', 1);
  B.connect(doc, 'chorus-tapout-right', 0, 'chorus-wet-right', 0);
  B.connect(doc, 'chorus-wet', 0, 'chorus-wet-right', 1);
  B.connect(doc, 'chorus-dry-right', 0, 'chorus-sum-right', 0);
  B.connect(doc, 'chorus-wet-right', 0, 'chorus-sum-right', 1);

  lineFromRoute(doc, 'fx-route', 5, 'delay-time', 1020, 470, null, 375);
  lineFromRoute(doc, 'fx-route', 6, 'delay-feedback', 1020, 510, null, 0.38);
  lineFromRoute(doc, 'fx-route', 7, 'delay-wet', 1020, 550, null, 0.18);
  lineFromRoute(doc, 'fx-route', 7, 'delay-dry', 1020, 590, 'expr 1. - $f1', 0.82);

  B.object(doc, 'delay-input-left', '+~', 1260, 460, 38);
  B.object(doc, 'delay-tapin-left', 'tapin~ 8000', 1310, 460, 86);
  B.object(doc, 'delay-tapout-left', 'tapout~ 375', 1410, 460, 90);
  B.object(doc, 'delay-feedback-left', '*~', 1515, 460, 38);
  B.object(doc, 'delay-input-right', '+~', 1260, 505, 38);
  B.object(doc, 'delay-tapin-right', 'tapin~ 8000', 1310, 505, 86);
  B.object(doc, 'delay-tapout-right', 'tapout~ 375', 1410, 505, 90);
  B.object(doc, 'delay-feedback-right', '*~', 1515, 505, 38);
  B.connect(doc, 'chorus-sum-left', 0, 'delay-input-left', 0);
  B.connect(doc, 'delay-feedback-left', 0, 'delay-input-left', 1);
  B.connect(doc, 'delay-input-left', 0, 'delay-tapin-left', 0);
  B.connect(doc, 'delay-tapin-left', 0, 'delay-tapout-left', 0);
  B.connect(doc, 'delay-time', 0, 'delay-tapout-left', 1);
  B.connect(doc, 'delay-tapout-left', 0, 'delay-feedback-left', 0);
  B.connect(doc, 'delay-feedback', 0, 'delay-feedback-left', 1);
  B.connect(doc, 'chorus-sum-right', 0, 'delay-input-right', 0);
  B.connect(doc, 'delay-feedback-right', 0, 'delay-input-right', 1);
  B.connect(doc, 'delay-input-right', 0, 'delay-tapin-right', 0);
  B.connect(doc, 'delay-tapin-right', 0, 'delay-tapout-right', 0);
  B.connect(doc, 'delay-time', 0, 'delay-tapout-right', 1);
  B.connect(doc, 'delay-tapout-right', 0, 'delay-feedback-right', 0);
  B.connect(doc, 'delay-feedback', 0, 'delay-feedback-right', 1);

  B.object(doc, 'delay-dry-left', '*~', 1260, 555, 38);
  B.object(doc, 'delay-wet-left', '*~', 1310, 555, 38);
  B.object(doc, 'delay-sum-left', '+~', 1360, 555, 38);
  B.object(doc, 'delay-dry-right', '*~', 1260, 595, 38);
  B.object(doc, 'delay-wet-right', '*~', 1310, 595, 38);
  B.object(doc, 'delay-sum-right', '+~', 1360, 595, 38);
  B.connect(doc, 'chorus-sum-left', 0, 'delay-dry-left', 0);
  B.connect(doc, 'delay-dry', 0, 'delay-dry-left', 1);
  B.connect(doc, 'delay-tapout-left', 0, 'delay-wet-left', 0);
  B.connect(doc, 'delay-wet', 0, 'delay-wet-left', 1);
  B.connect(doc, 'delay-dry-left', 0, 'delay-sum-left', 0);
  B.connect(doc, 'delay-wet-left', 0, 'delay-sum-left', 1);
  B.connect(doc, 'chorus-sum-right', 0, 'delay-dry-right', 0);
  B.connect(doc, 'delay-dry', 0, 'delay-dry-right', 1);
  B.connect(doc, 'delay-tapout-right', 0, 'delay-wet-right', 0);
  B.connect(doc, 'delay-wet', 0, 'delay-wet-right', 1);
  B.connect(doc, 'delay-dry-right', 0, 'delay-sum-right', 0);
  B.connect(doc, 'delay-wet-right', 0, 'delay-sum-right', 1);

  lineFromRoute(doc, 'fx-route', 8, 'reverb-time', 1020, 630, null, 2200);
  lineFromRoute(doc, 'fx-route', 9, 'reverb-damp', 1020, 670, null, 0.52);
  lineFromRoute(doc, 'fx-route', 10, 'reverb-wet', 1020, 710, null, 0.22);
  lineFromRoute(doc, 'fx-route', 10, 'reverb-dry', 1020, 750, 'expr 1. - $f1', 0.78);
  lineFromRoute(doc, 'fx-route', 11, 'output-gain', 1020, 790, null, 0.78);

  B.object(doc, 'reverb-left', 'cverb~ 2200 0.52', 1430, 555, 116);
  B.object(doc, 'reverb-right', 'cverb~ 2200 0.52', 1430, 595, 116);
  B.connect(doc, 'delay-sum-left', 0, 'reverb-left', 0);
  B.connect(doc, 'delay-sum-right', 0, 'reverb-right', 0);
  B.connect(doc, 'reverb-time', 0, 'reverb-left', 1);
  B.connect(doc, 'reverb-time', 0, 'reverb-right', 1);
  B.connect(doc, 'reverb-damp', 0, 'reverb-left', 2);
  B.connect(doc, 'reverb-damp', 0, 'reverb-right', 2);

  B.object(doc, 'reverb-dry-left', '*~', 1430, 645, 38);
  B.object(doc, 'reverb-wet-left', '*~', 1480, 645, 38);
  B.object(doc, 'reverb-sum-left', '+~', 1530, 645, 38);
  B.object(doc, 'reverb-dry-right', '*~', 1430, 685, 38);
  B.object(doc, 'reverb-wet-right', '*~', 1480, 685, 38);
  B.object(doc, 'reverb-sum-right', '+~', 1530, 685, 38);
  B.connect(doc, 'delay-sum-left', 0, 'reverb-dry-left', 0);
  B.connect(doc, 'reverb-dry', 0, 'reverb-dry-left', 1);
  B.connect(doc, 'reverb-left', 0, 'reverb-wet-left', 0);
  B.connect(doc, 'reverb-wet', 0, 'reverb-wet-left', 1);
  B.connect(doc, 'reverb-dry-left', 0, 'reverb-sum-left', 0);
  B.connect(doc, 'reverb-wet-left', 0, 'reverb-sum-left', 1);
  B.connect(doc, 'delay-sum-right', 0, 'reverb-dry-right', 0);
  B.connect(doc, 'reverb-dry', 0, 'reverb-dry-right', 1);
  B.connect(doc, 'reverb-right', 0, 'reverb-wet-right', 0);
  B.connect(doc, 'reverb-wet', 0, 'reverb-wet-right', 1);
  B.connect(doc, 'reverb-dry-right', 0, 'reverb-sum-right', 0);
  B.connect(doc, 'reverb-wet-right', 0, 'reverb-sum-right', 1);

  B.object(doc, 'output-left', '*~', 1590, 645, 38);
  B.object(doc, 'output-right', '*~', 1590, 685, 38);
  B.object(doc, 'output-clip-left', 'clip~ -0.98 0.98', 1640, 645, 96);
  B.object(doc, 'output-clip-right', 'clip~ -0.98 0.98', 1640, 685, 96);
  B.object(doc, 'plugout', 'plugout~', 1640, 740, 70);
  B.connect(doc, 'reverb-sum-left', 0, 'output-left', 0);
  B.connect(doc, 'reverb-sum-right', 0, 'output-right', 0);
  B.connect(doc, 'output-gain', 0, 'output-left', 1);
  B.connect(doc, 'output-gain', 0, 'output-right', 1);
  B.connect(doc, 'output-left', 0, 'output-clip-left', 0);
  B.connect(doc, 'output-right', 0, 'output-clip-right', 0);
  B.connect(doc, 'output-clip-left', 0, 'plugout', 0);
  B.connect(doc, 'output-clip-right', 0, 'plugout', 1);

  B.comment(doc, 'footer', 'Surprise Me samples within scene-specific ranges, caps oscillator energy, and prevents large reverb from competing with excessive delay feedback.', 20, 452, 1030, 12, false);
  return doc;
}

module.exports = buildSynthDevice;
