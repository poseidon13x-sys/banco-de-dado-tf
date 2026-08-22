'use strict';

var childProcess = require('node:child_process');
var fs = require('node:fs');
var path = require('node:path');

var root = path.resolve(__dirname, '..');
var devicesDir = path.join(root, 'devices');
var requiredDevices = [
  'Neon Magnet MIDI.amxd.maxpat',
  'Neon Magnet Synth.amxd.maxpat',
  'neon_magnet_voice.maxpat'
];
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

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function objectText(box) {
  return String((box && box.text) || '');
}

function inspectPatcher(patcher, label, counters) {
  var ids = {};
  var boxes = patcher.boxes || [];
  var lines = patcher.lines || [];

  boxes.forEach(function (entry) {
    var box = entry.box || {};
    if (!box.id) {
      fail(label + ': box without id');
    }
    if (ids[box.id]) {
      fail(label + ': duplicate box id ' + box.id);
    }
    ids[box.id] = true;
    counters.boxes += 1;
    if (box.patcher) {
      inspectPatcher(box.patcher, label + '/' + box.id, counters);
    }
  });

  lines.forEach(function (entry) {
    var line = entry.patchline || {};
    var source = line.source || [];
    var destination = line.destination || [];
    if (!ids[source[0]]) {
      fail(label + ': patchline source not found: ' + source[0]);
    }
    if (!ids[destination[0]]) {
      fail(label + ': patchline destination not found: ' + destination[0]);
    }
    if (Number(source[1]) < 0 || Number(destination[1]) < 0) {
      fail(label + ': negative patchline port index');
    }
    counters.lines += 1;
  });
}

function flattenedTexts(patcher, output) {
  (patcher.boxes || []).forEach(function (entry) {
    var box = entry.box || {};
    output.push(objectText(box));
    if (box.patcher) {
      flattenedTexts(box.patcher, output);
    }
  });
  return output;
}

function validateDevice(filename, expectedType, requiredObjects) {
  var absolute = path.join(devicesDir, filename);
  var document;
  var patcher;
  var texts;
  var counters = { boxes: 0, lines: 0 };

  if (!fs.existsSync(absolute)) {
    fail('missing generated device: ' + filename);
  }
  document = readJson(absolute);
  patcher = document.patcher;
  if (!patcher) {
    fail(filename + ': missing patcher root');
  }
  if (expectedType !== null && expectedType !== undefined && Number(patcher.amxdtype) !== expectedType) {
    fail(filename + ': unexpected amxdtype ' + patcher.amxdtype);
  }
  inspectPatcher(patcher, filename, counters);
  texts = flattenedTexts(patcher, []);
  requiredObjects.forEach(function (needle) {
    if (!texts.some(function (text) { return text.indexOf(needle) !== -1; })) {
      fail(filename + ': missing object ' + needle);
    }
  });
  return counters;
}

function validateRuntimeCopies() {
  runtimeSources.forEach(function (relative) {
    var source = path.join(root, relative);
    var target = path.join(devicesDir, 'code', path.basename(relative));
    if (!fs.existsSync(target)) {
      fail('missing runtime copy: ' + path.relative(root, target));
    }
    if (fs.readFileSync(source, 'utf8') !== fs.readFileSync(target, 'utf8')) {
      fail('runtime copy differs from source: ' + relative);
    }
  });
}

function validateJavaScriptSyntax() {
  var files = [];
  ['src/core', 'src/max', 'scripts', 'test'].forEach(function (folder) {
    function walk(current) {
      fs.readdirSync(current, { withFileTypes: true }).forEach(function (entry) {
        var absolute = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(absolute);
        } else if (/\.js$/.test(entry.name)) {
          files.push(absolute);
        }
      });
    }
    walk(path.join(root, folder));
  });
  files.forEach(function (file) {
    childProcess.execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  });
}

function validateManifest() {
  var manifestPath = path.join(devicesDir, 'manifest.json');
  var manifest;
  if (!fs.existsSync(manifestPath)) {
    fail('missing devices/manifest.json');
  }
  manifest = readJson(manifestPath);
  requiredDevices.forEach(function (filename) {
    if (JSON.stringify(manifest).indexOf(filename) === -1) {
      fail('manifest does not mention ' + filename);
    }
  });
}

function main() {
  var midi;
  var synth;
  var voice;
  validateJavaScriptSyntax();
  validateRuntimeCopies();
  validateManifest();
  midi = validateDevice('Neon Magnet MIDI.amxd.maxpat', 1835887981, [
    'js code/neon_magnet_midi.js', 'makenote', 'midiformat', 'midiout'
  ]);
  synth = validateDevice('Neon Magnet Synth.amxd.maxpat', 1768515945, [
    'js code/neon_magnet_synth.js', 'poly~ neon_magnet_voice 8', 'plugout~'
  ]);
  voice = validateDevice('neon_magnet_voice.maxpat', null, [
    'thispoly~', 'adsr~', 'saw~', 'svf~'
  ]);
  process.stdout.write(JSON.stringify({
    ok: true,
    devices: { midi: midi, synth: synth, voice: voice }
  }, null, 2) + '\nNeon Magnet validation passed.\n');
}

main();
