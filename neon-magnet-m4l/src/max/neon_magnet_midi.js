autowatch = 1;
inlets = 1;
outlets = 4;

include('seeded-random.js');
include('music-theory.js');
include('arp-engine.js');
include('magnetic-rate.js');
include('melody-engine.js');
include('surprise-engine.js');

var MagneticRate = NeonMagnetMagneticRate;
var Music = NeonMagnetMusic;
var Melody = NeonMagnetMelody;
var Arp = NeonMagnetArp;
var Surprise = NeonMagnetSurprise;

var config = {
  running: 0,
  source: 'melody',
  rateMode: 'magnet',
  rateMs: 125,
  syncDivision: '1/16',
  includeTriplets: 0,
  includeDotted: 0,
  gate: 0.82,
  root: 0,
  scale: 'minor',
  style: 'neon_drive',
  density: 0.7,
  motion: 0.5,
  octaveRange: 2,
  bars: 2,
  seed: 8086,
  arpMode: 'updown',
  arpOctaves: 2
};

var rateState = { lockedDivisionId: null };
var lastLocked = false;
var pattern = null;
var patternByStep = {};
var playhead = 0;
var heldNotes = [];
var heldVelocities = {};
var arpStep = 0;
var arpCycle = 0;
var scheduler = null;
var songApi = null;
var fallbackBpm = 120;
var lastPreset = null;

function safeNumber(value, fallback) {
  var candidate = value;
  if (candidate instanceof Array) {
    candidate = candidate[candidate.length - 1];
  }
  candidate = Number(candidate);
  return isFinite(candidate) ? candidate : fallback;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function boolValue(value) {
  return Number(value) > 0 ? 1 : 0;
}

function status(message) {
  outlet(0, 'status', String(message));
}

function emitRate(result) {
  outlet(1, 'set', result.label);
  outlet(0, 'rate', result.zone, result.effectiveMs, result.division ? result.division.id : 'none', result.magnetAmount);
}

function emitParameter(name, value) {
  outlet(3, name, value);
}

function ensureLiveApi() {
  if (songApi || typeof LiveAPI === 'undefined') {
    return;
  }
  try {
    songApi = new LiveAPI(null, 'live_set');
  } catch (error) {
    songApi = null;
    status('LiveAPI unavailable; using 120 BPM fallback');
  }
}

function liveProperty(name, fallback) {
  ensureLiveApi();
  if (!songApi) {
    return fallback;
  }
  try {
    return safeNumber(songApi.get(name), fallback);
  } catch (error) {
    return fallback;
  }
}

function currentBpm() {
  return clamp(liveProperty('tempo', fallbackBpm), 20, 999);
}

function currentSongBeat() {
  return Math.max(0, liveProperty('current_song_time', 0));
}

function transportIsPlaying() {
  return liveProperty('is_playing', 1) > 0;
}

function currentRate() {
  var bpm = currentBpm();
  var result;

  if (config.rateMode === 'sync') {
    result = MagneticRate.resolveSync(config.syncDivision, bpm, {
      includeTriplets: true,
      includeDotted: true
    });
    rateState = result.state;
    return result;
  }

  if (config.rateMode === 'free') {
    rateState = { lockedDivisionId: null };
    return {
      rawMs: config.rateMs,
      effectiveMs: config.rateMs,
      bpm: bpm,
      zone: 'free',
      locked: false,
      magnetAmount: 0,
      division: null,
      label: Math.round(config.rateMs * 10) / 10 + ' ms',
      state: rateState
    };
  }

  result = MagneticRate.resolveRate(config.rateMs, bpm, {
    includeTriplets: !!config.includeTriplets,
    includeDotted: !!config.includeDotted,
    enterThreshold: 0.065,
    exitThreshold: 0.095,
    magneticRange: 0.22,
    minimumMs: 15,
    maximumMs: 8000
  }, rateState);
  rateState = result.state;
  return result;
}

function regeneratePattern(resetPlayhead) {
  pattern = Melody.generatePattern({
    seed: config.seed,
    style: config.style,
    root: config.root,
    scale: config.scale,
    bars: config.bars,
    beatsPerBar: 4,
    stepsPerBeat: 4,
    density: config.density,
    motion: config.motion,
    octaveRange: config.octaveRange,
    baseMidi: 48 + config.root,
    gate: config.gate
  });
  patternByStep = Melody.indexByStep(pattern);
  if (resetPlayhead) {
    playhead = 0;
  }
  outlet(0, 'pattern', JSON.stringify(pattern));
}

function ensureScheduler() {
  if (!scheduler && typeof Task !== 'undefined') {
    scheduler = new Task(clockTick, this);
  }
}

function cancelScheduler() {
  if (scheduler) {
    scheduler.cancel();
  }
}

function scheduleNext(forceAlignment) {
  var rate;
  var delay;
  var enteringLock;

  if (!config.running) {
    return;
  }
  ensureScheduler();
  if (!scheduler) {
    status('Task unavailable; scheduler cannot run');
    return;
  }

  rate = currentRate();
  emitRate(rate);
  enteringLock = rate.locked && !lastLocked;
  delay = rate.effectiveMs;

  if ((forceAlignment || enteringLock) && rate.locked && rate.division && transportIsPlaying()) {
    delay = MagneticRate.nextGridDelayMs(currentSongBeat(), rate.division.beats, rate.bpm);
    if (delay < 2) {
      delay = rate.effectiveMs;
    }
  }

  lastLocked = rate.locked;
  scheduler.cancel();
  scheduler.schedule(Math.max(1, delay));
}

function outputNote(pitch, velocity, durationMs) {
  outlet(2, Math.round(pitch), Math.round(velocity), Math.max(1, Math.round(durationMs)));
}

function nextMelodyNote(rateMs) {
  var step;
  var note;
  if (!pattern) {
    regeneratePattern(true);
  }
  step = playhead % Math.max(1, pattern.totalSteps);
  note = patternByStep[step];
  playhead = (playhead + 1) % Math.max(1, pattern.totalSteps);
  if (!note) {
    return null;
  }
  return {
    pitch: note.pitch,
    velocity: note.velocity,
    durationMs: rateMs * note.durationSteps * config.gate
  };
}

function velocityForArpPitch(pitch) {
  var exact = heldVelocities[pitch];
  var index;
  if (exact !== undefined) {
    return exact;
  }
  for (index = heldNotes.length - 1; index >= 0; index -= 1) {
    if (heldNotes[index] % 12 === pitch % 12 && heldVelocities[heldNotes[index]] !== undefined) {
      return heldVelocities[heldNotes[index]];
    }
  }
  return 100;
}

function nextArpeggiatedNote(rateMs) {
  var order = Arp.buildOrder(heldNotes, config.arpMode, config.arpOctaves, config.seed, arpCycle);
  var pitch;
  if (!order.length) {
    return null;
  }
  pitch = Arp.noteAt(order, arpStep);
  arpStep += 1;
  if (arpStep >= order.length) {
    arpStep = 0;
    arpCycle += 1;
  }
  return {
    pitch: pitch,
    velocity: velocityForArpPitch(pitch),
    durationMs: rateMs * config.gate
  };
}

function clockTick() {
  var rate;
  var event;
  if (!config.running) {
    return;
  }
  rate = currentRate();
  event = config.source === 'arp' ? nextArpeggiatedNote(rate.effectiveMs) : nextMelodyNote(rate.effectiveMs);
  if (event) {
    outputNote(event.pitch, event.velocity, event.durationMs);
  }
  lastLocked = rate.locked;
  scheduleNext(false);
}

function flushNotes() {
  outlet(2, 'stop');
}

function run(value) {
  config.running = boolValue(value);
  cancelScheduler();
  lastLocked = false;
  if (config.running) {
    status('running');
    scheduleNext(true);
  } else {
    flushNotes();
    status('stopped');
  }
}

function source(value) {
  config.source = String(value).toLowerCase() === 'arp' ? 'arp' : 'melody';
  playhead = 0;
  arpStep = 0;
  status('source ' + config.source);
}

function rate_mode(value) {
  var candidate = String(value).toLowerCase();
  config.rateMode = candidate === 'free' || candidate === 'sync' ? candidate : 'magnet';
  rateState = { lockedDivisionId: null };
  lastLocked = false;
  emitRate(currentRate());
  if (config.running) {
    scheduleNext(true);
  }
}

function rate(value) {
  config.rateMs = clamp(safeNumber(value, config.rateMs), 15, 8000);
  emitRate(currentRate());
  if (config.running) {
    scheduleNext(false);
  }
}

function sync_division(value) {
  config.syncDivision = String(value || '1/16');
  if (config.rateMode === 'sync' && config.running) {
    scheduleNext(true);
  }
}

function triplets(value) {
  config.includeTriplets = boolValue(value);
  rateState = { lockedDivisionId: null };
  emitRate(currentRate());
}

function dotted(value) {
  config.includeDotted = boolValue(value);
  rateState = { lockedDivisionId: null };
  emitRate(currentRate());
}

function gate(value) {
  config.gate = clamp(safeNumber(value, config.gate), 0.1, 2);
  regeneratePattern(false);
}

function root_note(value) {
  config.root = Music.normalizeRoot(value);
  regeneratePattern(true);
}

function scale(value) {
  config.scale = String(value || 'minor').toLowerCase().replace(/[ -]+/g, '_');
  regeneratePattern(true);
}

function style(value) {
  config.style = String(value || 'neon_drive').toLowerCase().replace(/[ -]+/g, '_');
  regeneratePattern(true);
}

function density(value) {
  config.density = clamp(safeNumber(value, config.density), 0, 1);
  regeneratePattern(false);
}

function motion(value) {
  config.motion = clamp(safeNumber(value, config.motion), 0, 1);
  regeneratePattern(false);
}

function octave_range(value) {
  config.octaveRange = Math.max(1, Math.min(3, Math.round(safeNumber(value, config.octaveRange))));
  regeneratePattern(true);
}

function bars(value) {
  config.bars = Math.max(1, Math.min(8, Math.round(safeNumber(value, config.bars))));
  regeneratePattern(true);
}

function seed(value) {
  config.seed = String(value);
  arpCycle = 0;
  regeneratePattern(true);
}

function new_melody() {
  config.seed = String(new Date().getTime());
  emitParameter('seed', config.seed);
  regeneratePattern(true);
  status('new melody ' + config.seed);
}

function arp_mode(value) {
  config.arpMode = String(value || 'up').toLowerCase();
  arpStep = 0;
  arpCycle = 0;
}

function arp_octaves(value) {
  config.arpOctaves = Math.max(1, Math.min(4, Math.round(safeNumber(value, config.arpOctaves))));
  arpStep = 0;
}

function note(pitch, velocity) {
  var numericPitch = Math.max(0, Math.min(127, Math.round(safeNumber(pitch, 60))));
  var numericVelocity = Math.max(0, Math.min(127, Math.round(safeNumber(velocity, 0))));
  var index = heldNotes.indexOf(numericPitch);

  if (numericVelocity > 0) {
    if (index === -1) {
      heldNotes.push(numericPitch);
    }
    heldVelocities[numericPitch] = numericVelocity;
  } else {
    if (index !== -1) {
      heldNotes.splice(index, 1);
    }
    delete heldVelocities[numericPitch];
  }
  arpStep = 0;
}

function applyMelodyPreset(preset) {
  config.style = preset.style;
  config.density = preset.density;
  config.motion = preset.motion;
  config.octaveRange = preset.octaveRange;
  config.gate = preset.gate;
  config.arpMode = preset.arpMode;
  config.rateMs = preset.rateMs;
  emitParameter('style', config.style);
  emitParameter('density', config.density);
  emitParameter('motion', config.motion);
  emitParameter('octave_range', config.octaveRange);
  emitParameter('gate', config.gate);
  emitParameter('arp_mode', config.arpMode);
  emitParameter('rate', config.rateMs);
  regeneratePattern(true);
}

function surprise(scene, intensity) {
  lastPreset = Surprise.generatePreset({
    seed: String(config.seed) + '::' + new Date().getTime(),
    scene: scene || 'auto',
    intensity: intensity === undefined ? 0.82 : clamp(safeNumber(intensity, 0.82), 0.15, 1),
    root: config.root,
    scale: config.scale
  });
  applyMelodyPreset(lastPreset.melody);
  outlet(0, 'preset', JSON.stringify(lastPreset));
  status('surprise ' + lastPreset.scene);
}

function dump() {
  outlet(0, 'config', JSON.stringify(config));
  outlet(0, 'held_notes', heldNotes);
  if (lastPreset) {
    outlet(0, 'preset', JSON.stringify(lastPreset));
  }
}

function loadbang() {
  ensureLiveApi();
  regeneratePattern(true);
  emitRate(currentRate());
  status('ready');
}
