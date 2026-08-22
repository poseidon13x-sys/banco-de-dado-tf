'use strict';

var fs = require('node:fs');
var path = require('node:path');
var B = require('./lib/patcher-builder');
var buildMidiDevice = require('./lib/build-midi-device');
var buildSynthDevice = require('./lib/build-synth-device');
var buildVoicePatcher = require('./lib/build-voice-patcher');

var root = path.resolve(__dirname, '..');
var devices = path.join(root, 'devices');
var code = path.join(devices, 'code');
var runtimeSources = [
  'src/core/seeded-random.js',
  'src/core/music-theory.js',
  'src/core/arp-engine.js',
  'src/core/magnetic-rate.js',
  'src/core/melody-engine.js',
  'src/core/surprise-engine.js',
  'src/max/neon_magnet_midi.js',
  'src/max/neon_magnet_synth.js'
];

function ensureDirectories() {
  fs.mkdirSync(code, { recursive: true });
}

function writeDevice(filename, document) {
  B.save(path.join(devices, filename), document, fs);
  return {
    file: filename,
    boxes: document.patcher.boxes.length,
    patchlines: document.patcher.lines.length,
    amxdtype: document.patcher.amxdtype === undefined ? null : document.patcher.amxdtype
  };
}

function copyRuntime() {
  return runtimeSources.map(function (relative) {
    var source = path.join(root, relative);
    var target = path.join(code, path.basename(relative));
    fs.copyFileSync(source, target);
    return path.relative(root, target).replace(/\\/g, '/');
  });
}

function main() {
  var manifest;
  ensureDirectories();
  manifest = {
    name: 'Neon Magnet',
    version: '0.1.0',
    generatedAt: 'deterministic-build',
    chain: ['Neon Magnet MIDI.amxd.maxpat', 'Neon Magnet Synth.amxd.maxpat'],
    devices: [
      writeDevice('Neon Magnet MIDI.amxd.maxpat', buildMidiDevice()),
      writeDevice('Neon Magnet Synth.amxd.maxpat', buildSynthDevice()),
      writeDevice('neon_magnet_voice.maxpat', buildVoicePatcher())
    ],
    runtime: copyRuntime()
  };
  fs.writeFileSync(path.join(devices, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  process.stdout.write('Generated Neon Magnet MIDI, Synth and poly~ voice patchers.\n');
}

main();
