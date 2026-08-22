'use strict';

var B = require('./patcher-builder');

function prependControl(doc, controlId, id, selector, x, y, outlet) {
  B.object(doc, id, 'prepend ' + selector, x, y, 112);
  B.connect(doc, controlId, outlet || 0, id, 0);
  B.connect(doc, id, 0, 'midi-js', 0);
}

function menuControl(doc, id, name, items, x, y, width, selector, initial) {
  B.menu(doc, id, name, items, x, y, width, initial || 0);
  prependControl(doc, id, id + '-prepend', selector, x, y + 34, 1);
}

function buildMidiDevice() {
  var doc = B.document({ amxdtype: 1835887981, rect: [0, 0, 1420, 760] });

  B.comment(doc, 'title', 'NEON MAGNET — MELODY + MAGNETIC ARP', 18, 12, 530, 17, true);
  B.comment(doc, 'subtitle', 'Free timing that becomes musically magnetic near the Live grid', 18, 38, 530, 11, false);
  B.object(doc, 'midi-js', 'js code/neon_magnet_midi.js', 620, 350, 210);

  B.toggle(doc, 'run', 'Run', 20, 76, 0);
  B.comment(doc, 'run-label', 'RUN', 20, 98, 44, 10, true);
  prependControl(doc, 'run', 'run-prepend', 'run', 20, 132);

  menuControl(doc, 'source', 'Source', ['melody', ',', 'arp'], 72, 76, 92, 'source', 0);
  B.comment(doc, 'source-label', 'SOURCE', 72, 101, 75, 10, true);

  menuControl(doc, 'rate-mode', 'Rate Mode', ['free', ',', 'magnet', ',', 'sync'], 180, 76, 100, 'rate_mode', 1);
  B.comment(doc, 'rate-mode-label', 'RATE MODE', 180, 101, 85, 10, true);

  B.dial(doc, 'rate', 'Rate', 298, 68, 15, 8000, 125, 2);
  B.comment(doc, 'rate-label', 'RATE / ms', 292, 119, 72, 10, true);
  prependControl(doc, 'rate', 'rate-prepend', 'rate', 298, 145);

  menuControl(doc, 'sync-division', 'Sync Division', ['1/64', ',', '1/32', ',', '1/16', ',', '1/8', ',', '1/4', ',', '1/2', ',', '1/1'], 380, 76, 90, 'sync_division', 2);
  B.comment(doc, 'sync-label', 'SYNC', 380, 101, 50, 10, true);

  B.toggle(doc, 'triplets', 'Triplets', 488, 76, 0);
  B.comment(doc, 'triplets-label', 'TRIPLET', 482, 99, 62, 10, true);
  prependControl(doc, 'triplets', 'triplets-prepend', 'triplets', 488, 132);

  B.toggle(doc, 'dotted', 'Dotted', 555, 76, 0);
  B.comment(doc, 'dotted-label', 'DOTTED', 551, 99, 60, 10, true);
  prependControl(doc, 'dotted', 'dotted-prepend', 'dotted', 555, 132);

  B.comment(doc, 'rate-display', '125 ms → 1/16', 628, 76, 210, 14, true);
  B.connect(doc, 'midi-js', 1, 'rate-display', 0);
  B.comment(doc, 'status-display', 'ready', 628, 104, 210, 11, false);
  B.object(doc, 'status-route', 'route status', 620, 322, 88);
  B.connect(doc, 'midi-js', 0, 'status-route', 0);
  B.connect(doc, 'status-route', 0, 'status-display', 0);

  B.comment(doc, 'melody-section', 'MELODY RULES', 20, 204, 220, 14, true);
  B.dial(doc, 'root', 'Root', 20, 236, 0, 11, 0, 0);
  B.comment(doc, 'root-label', 'ROOT', 25, 287, 45, 10, true);
  prependControl(doc, 'root', 'root-prepend', 'root_note', 20, 314);

  menuControl(doc, 'scale', 'Scale', ['minor', ',', 'dorian', ',', 'harmonic_minor', ',', 'melodic_minor', ',', 'minor_pentatonic', ',', 'major', ',', 'mixolydian'], 86, 245, 132, 'scale', 0);
  B.comment(doc, 'scale-label', 'SCALE', 86, 271, 52, 10, true);

  menuControl(doc, 'style', 'Style', ['neon_drive', ',', 'noir_rain', ',', 'french_electro', ',', 'midnight_signal'], 236, 245, 142, 'style', 0);
  B.comment(doc, 'style-label', 'SCENE', 236, 271, 52, 10, true);

  B.dial(doc, 'density', 'Density', 398, 236, 0, 1, 0.7, 1);
  B.comment(doc, 'density-label', 'DENSITY', 393, 287, 65, 10, true);
  prependControl(doc, 'density', 'density-prepend', 'density', 398, 314);

  B.dial(doc, 'motion', 'Motion', 468, 236, 0, 1, 0.5, 1);
  B.comment(doc, 'motion-label', 'MOTION', 468, 287, 58, 10, true);
  prependControl(doc, 'motion', 'motion-prepend', 'motion', 468, 314);

  B.dial(doc, 'gate', 'Gate', 538, 236, 0.1, 2, 0.82, 1);
  B.comment(doc, 'gate-label', 'GATE', 545, 287, 45, 10, true);
  prependControl(doc, 'gate', 'gate-prepend', 'gate', 538, 314);

  B.dial(doc, 'octave-range', 'Octave Range', 608, 236, 1, 3, 2, 0);
  B.comment(doc, 'octave-label', 'RANGE', 608, 287, 55, 10, true);
  prependControl(doc, 'octave-range', 'octave-prepend', 'octave_range', 608, 314);

  B.dial(doc, 'bars', 'Bars', 678, 236, 1, 8, 2, 0);
  B.comment(doc, 'bars-label', 'BARS', 685, 287, 45, 10, true);
  prependControl(doc, 'bars', 'bars-prepend', 'bars', 678, 314);

  B.comment(doc, 'arp-section', 'ARPEGGIATOR', 20, 394, 220, 14, true);
  menuControl(doc, 'arp-mode', 'Arp Mode', ['up', ',', 'down', ',', 'updown', ',', 'downup', ',', 'random', ',', 'as_played'], 20, 428, 116, 'arp_mode', 2);
  B.comment(doc, 'arp-mode-label', 'ORDER', 20, 454, 52, 10, true);

  B.dial(doc, 'arp-octaves', 'Arp Octaves', 154, 418, 1, 4, 2, 0);
  B.comment(doc, 'arp-octaves-label', 'OCTAVES', 150, 469, 68, 10, true);
  prependControl(doc, 'arp-octaves', 'arp-octaves-prepend', 'arp_octaves', 154, 496);

  B.button(doc, 'new-melody', 'NEW MELODY', 246, 428, 112);
  B.message(doc, 'new-melody-message', 'new_melody', 246, 466, 92);
  B.connect(doc, 'new-melody', 0, 'new-melody-message', 0);
  B.connect(doc, 'new-melody-message', 0, 'midi-js', 0);

  B.button(doc, 'surprise', 'SURPRISE ME', 374, 428, 118);
  B.message(doc, 'surprise-message', 'surprise auto 0.82', 374, 466, 122);
  B.connect(doc, 'surprise', 0, 'surprise-message', 0);
  B.connect(doc, 'surprise-message', 0, 'midi-js', 0);

  B.comment(doc, 'magnet-explainer', 'MAGNET mode is continuous in milliseconds. As the rate approaches a musical division, it is gently attracted; inside the lock zone it snaps exactly to the grid. Separate enter/exit thresholds prevent chatter.', 525, 404, 350, 75, 11, false);

  B.object(doc, 'notein', 'notein', 900, 70, 58);
  B.object(doc, 'note-pack', 'pack 0 0', 900, 106, 72);
  B.object(doc, 'note-prepend', 'prepend note', 900, 142, 92);
  B.connect(doc, 'notein', 0, 'note-pack', 0);
  B.connect(doc, 'notein', 1, 'note-pack', 1);
  B.connect(doc, 'note-pack', 0, 'note-prepend', 0);
  B.connect(doc, 'note-prepend', 0, 'midi-js', 0);

  B.object(doc, 'generated-unpack', 'unpack 0 0 0', 900, 350, 104);
  B.object(doc, 'makenote', 'makenote 100 125', 900, 390, 116);
  B.object(doc, 'midiformat', 'midiformat', 900, 432, 78);
  B.object(doc, 'midiout', 'midiout', 900, 474, 64);
  B.connect(doc, 'midi-js', 2, 'generated-unpack', 0);
  B.connect(doc, 'generated-unpack', 2, 'makenote', 2);
  B.connect(doc, 'generated-unpack', 1, 'makenote', 1);
  B.connect(doc, 'generated-unpack', 0, 'makenote', 0);
  B.connect(doc, 'makenote', 0, 'midiformat', 0);
  B.connect(doc, 'makenote', 1, 'midiformat', 1);
  B.connect(doc, 'midiformat', 0, 'midiout', 0);

  B.object(doc, 'param-route', 'route rate density motion gate octave_range style arp_mode seed', 620, 520, 430);
  B.connect(doc, 'midi-js', 3, 'param-route', 0);
  ['rate', 'density', 'motion', 'gate', 'octave-range'].forEach(function (target, index) {
    var id = 'set-' + target;
    B.object(doc, id, 'prepend set', 620 + index * 92, 560, 78);
    B.connect(doc, 'param-route', index, id, 0);
    B.connect(doc, id, 0, target, 0);
  });
  B.object(doc, 'set-style', 'prepend set', 1080, 560, 78);
  B.object(doc, 'set-arp-mode', 'prepend set', 1170, 560, 78);
  B.connect(doc, 'param-route', 5, 'set-style', 0);
  B.connect(doc, 'param-route', 6, 'set-arp-mode', 0);
  B.connect(doc, 'set-style', 0, 'style', 0);
  B.connect(doc, 'set-arp-mode', 0, 'arp-mode', 0);

  B.comment(doc, 'footer', 'Place before Neon Magnet Synth or any other Live instrument. Root and scale are never changed by Surprise Me.', 20, 530, 830, 12, false);
  return doc;
}

module.exports = buildMidiDevice;
