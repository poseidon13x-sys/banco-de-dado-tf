'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

var root = path.resolve(__dirname, '..');

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(root, 'devices', name), 'utf8'));
}

function texts(document) {
  var output = [];
  function visit(patcher) {
    (patcher.boxes || []).forEach(function (entry) {
      var box = entry.box || {};
      output.push(String(box.text || ''));
      if (box.patcher) {
        visit(box.patcher);
      }
    });
  }
  visit(document.patcher);
  return output;
}

function validateReferences(document) {
  function visit(patcher) {
    var ids = new Set((patcher.boxes || []).map(function (entry) { return entry.box.id; }));
    (patcher.lines || []).forEach(function (entry) {
      assert.equal(ids.has(entry.patchline.source[0]), true, 'missing patchline source');
      assert.equal(ids.has(entry.patchline.destination[0]), true, 'missing patchline destination');
    });
    (patcher.boxes || []).forEach(function (entry) {
      if (entry.box.patcher) {
        visit(entry.box.patcher);
      }
    });
  }
  visit(document.patcher);
}

test('generated devices have the correct Max for Live device types', function () {
  assert.equal(read('Neon Magnet MIDI.amxd.maxpat').patcher.amxdtype, 1835887981);
  assert.equal(read('Neon Magnet Synth.amxd.maxpat').patcher.amxdtype, 1768515945);
});

test('MIDI patcher contains the complete generated-note path and valid references', function () {
  var document = read('Neon Magnet MIDI.amxd.maxpat');
  var all = texts(document).join('\n');
  ['notein', 'js code/neon_magnet_midi.js', 'makenote', 'midiformat', 'midiout'].forEach(function (needle) {
    assert.ok(all.indexOf(needle) !== -1, 'missing ' + needle);
  });
  validateReferences(document);
});

test('synth and voice patchers contain polyphony, chorus, delay, reverb and release-aware voice state', function () {
  var synth = read('Neon Magnet Synth.amxd.maxpat');
  var voice = read('neon_magnet_voice.maxpat');
  var synthText = texts(synth).join('\n');
  var voiceText = texts(voice).join('\n');
  ['poly~ neon_magnet_voice 8', 'tapin~ 100', 'tapin~ 8000', 'cverb~', 'plugout~'].forEach(function (needle) {
    assert.ok(synthText.indexOf(needle) !== -1, 'missing ' + needle);
  });
  ['thispoly~', 'adsr~', 'saw~', 'svf~', 'out~ 1', 'out~ 2'].forEach(function (needle) {
    assert.ok(voiceText.indexOf(needle) !== -1, 'missing ' + needle);
  });
  validateReferences(synth);
  validateReferences(voice);
});
