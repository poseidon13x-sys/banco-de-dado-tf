'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var path = require('node:path');

var projectRoot = path.resolve(__dirname, '..');
var midiSource = fs.readFileSync(path.join(projectRoot, 'src/max/neon_magnet_midi.js'), 'utf8');
var synthSource = fs.readFileSync(path.join(projectRoot, 'src/max/neon_magnet_synth.js'), 'utf8');

function includesAll(source, snippets) {
  snippets.forEach(function (snippet) {
    assert.ok(source.indexOf(snippet) !== -1, 'missing adapter fragment: ' + snippet);
  });
}

test('MIDI adapter loads every musical core and exposes four Max outlets', function () {
  includesAll(midiSource, [
    "include('seeded-random.js')",
    "include('music-theory.js')",
    "include('arp-engine.js')",
    "include('magnetic-rate.js')",
    "include('melody-engine.js')",
    "include('surprise-engine.js')",
    'outlets = 4'
  ]);
});

test('MIDI adapter resolves free, magnetic and synchronized rates against Live transport', function () {
  includesAll(midiSource, [
    'new LiveAPI',
    "'current_song_time'",
    'MagneticRate.resolveRate',
    'MagneticRate.resolveSync',
    'MagneticRate.nextGridDelayMs',
    'new Task'
  ]);
});

test('MIDI adapter explicitly flushes scheduled notes when stopped', function () {
  includesAll(midiSource, [
    'function flushNotes',
    "outlet(2, 'stop')",
    'scheduler.cancel()'
  ]);
});

test('synth adapter exposes deterministic voice and global effects control', function () {
  includesAll(synthSource, [
    "include('surprise-engine.js')",
    "include('magnetic-rate.js')",
    "emitVoice('saw'",
    "emitVoice('cutoff'",
    "emitFx('chorus_mix'",
    "emitFx('delay_time'",
    "emitFx('reverb_mix'"
  ]);
});

test('synth adapter keeps feedback and wet effects inside bounded ranges', function () {
  includesAll(synthSource, [
    'function delay_feedback',
    'function delay_mix',
    'function reverb_mix',
    'clamp'
  ]);
  assert.doesNotMatch(synthSource, /delayFeedback\s*=\s*1(?:\.0+)?(?:;|,)/);
  assert.doesNotMatch(synthSource, /reverbMix\s*=\s*1(?:\.0+)?(?:;|,)/);
});
