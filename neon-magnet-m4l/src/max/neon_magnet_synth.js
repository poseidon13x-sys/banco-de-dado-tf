autowatch = 1;
inlets = 1;
outlets = 3;

include('seeded-random.js');
include('music-theory.js');
include('magnetic-rate.js');
include('surprise-engine.js');

var Music = NeonMagnetMusic;
var Surprise = NeonMagnetSurprise;
var Rate = NeonMagnetMagneticRate;

var config = {
  saw: 0.72,
  pulse: 0.35,
  sub: 0.28,
  noise: 0.015,
  pwm: 0.5,
  cutoff: 0.58,
  resonance: 0.22,
  envAmount: 0.38,
  attackMs: 8,
  decayMs: 280,
  sustain: 0.68,
  releaseMs: 620,
  drive: 0.18,
  chorusMode: 2,
  chorusMix: 0.42,
  chorusRateHz: 0.92,
  chorusDepthMs: 4.8,
  delayDivision: '1/8D',
  delayFeedback: 0.38,
  delayMix: 0.18,
  reverbTimeMs: 2200,
  reverbDamp: 0.52,
  reverbMix: 0.22,
  output: 0.78,
  scene: 'neon_drive',
  root: 0,
  scale: 'minor'
};

var songApi = null;
var fallbackBpm = 120;
var lastPreset = null;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function safeNumber(value, fallback) {
  var candidate = value;
  if (candidate instanceof Array) {
    candidate = candidate[candidate.length - 1];
  }
  candidate = Number(candidate);
  return isFinite(candidate) ? candidate : fallback;
}

function emitVoice(name, value) {
  outlet(0, name, value);
}

function emitFx(name, value) {
  outlet(1, name, value);
}

function emitUi(name, value) {
  outlet(2, 'ui', name, value);
}

function emitStatus(message) {
  outlet(2, 'set', String(message));
}

function ensureLiveApi() {
  if (songApi || typeof LiveAPI === 'undefined') {
    return;
  }
  try {
    songApi = new LiveAPI(null, 'live_set');
  } catch (error) {
    songApi = null;
    emitStatus('LiveAPI unavailable; delay uses 120 BPM');
  }
}

function currentBpm() {
  var tempo;
  ensureLiveApi();
  if (!songApi) {
    return fallbackBpm;
  }
  try {
    tempo = songApi.get('tempo');
    return clamp(safeNumber(tempo, fallbackBpm), 20, 999);
  } catch (error) {
    return fallbackBpm;
  }
}

function cutoffHz(normalized) {
  return 45 * Math.pow(18000 / 45, clamp(normalized, 0, 1));
}

function resonanceQ(normalized) {
  return 0.65 + clamp(normalized, 0, 0.75) * 14.2;
}

function delayMs() {
  return Rate.resolveSync(config.delayDivision, currentBpm(), {
    includeTriplets: true,
    includeDotted: true
  }).effectiveMs;
}

function sendAll() {
  emitVoice('saw', config.saw);
  emitVoice('pulse', config.pulse);
  emitVoice('sub', config.sub);
  emitVoice('noise', config.noise);
  emitVoice('pwm', config.pwm);
  emitVoice('cutoff', cutoffHz(config.cutoff));
  emitVoice('resonance', resonanceQ(config.resonance));
  emitVoice('env_amount', config.envAmount);
  emitVoice('attack', config.attackMs);
  emitVoice('decay', config.decayMs);
  emitVoice('sustain', config.sustain);
  emitVoice('release', config.releaseMs);
  emitFx('drive', config.drive);
  emitFx('chorus_mode', config.chorusMode);
  emitFx('chorus_mix', config.chorusMix);
  emitFx('chorus_rate', config.chorusRateHz);
  emitFx('chorus_depth', config.chorusDepthMs);
  emitFx('delay_time', delayMs());
  emitFx('delay_feedback', config.delayFeedback);
  emitFx('delay_mix', config.delayMix);
  emitFx('reverb_time', config.reverbTimeMs);
  emitFx('reverb_damp', config.reverbDamp);
  emitFx('reverb_mix', config.reverbMix);
  emitFx('output', config.output);
}

function emitUiState() {
  var keys = [
    'saw', 'pulse', 'sub', 'noise', 'pwm', 'cutoff', 'resonance', 'envAmount',
    'attackMs', 'decayMs', 'sustain', 'releaseMs', 'drive', 'chorusMode',
    'chorusMix', 'delayDivision', 'delayFeedback', 'delayMix', 'reverbTimeMs',
    'reverbDamp', 'reverbMix', 'output', 'scene'
  ];
  keys.forEach(function (key) {
    emitUi(key, config[key]);
  });
}

function voiceNormalized(name, selector, value, minimum, maximum) {
  config[name] = clamp(safeNumber(value, config[name]), minimum, maximum);
  emitVoice(selector, config[name]);
}

function saw(value) { voiceNormalized('saw', 'saw', value, 0, 1); }
function pulse(value) { voiceNormalized('pulse', 'pulse', value, 0, 1); }
function sub(value) { voiceNormalized('sub', 'sub', value, 0, 1); }
function noise(value) { voiceNormalized('noise', 'noise', value, 0, 0.2); }
function pwm(value) { voiceNormalized('pwm', 'pwm', value, 0.08, 0.92); }

function cutoff(value) {
  config.cutoff = clamp(safeNumber(value, config.cutoff), 0, 1);
  emitVoice('cutoff', cutoffHz(config.cutoff));
}

function resonance(value) {
  config.resonance = clamp(safeNumber(value, config.resonance), 0, 0.75);
  emitVoice('resonance', resonanceQ(config.resonance));
}

function env_amount(value) {
  config.envAmount = clamp(safeNumber(value, config.envAmount), 0, 1);
  emitVoice('env_amount', config.envAmount);
}

function attack(value) {
  config.attackMs = clamp(safeNumber(value, config.attackMs), 1, 5000);
  emitVoice('attack', config.attackMs);
}

function decay(value) {
  config.decayMs = clamp(safeNumber(value, config.decayMs), 10, 7000);
  emitVoice('decay', config.decayMs);
}

function sustain(value) {
  config.sustain = clamp(safeNumber(value, config.sustain), 0, 1);
  emitVoice('sustain', config.sustain);
}

function release(value) {
  config.releaseMs = clamp(safeNumber(value, config.releaseMs), 20, 10000);
  emitVoice('release', config.releaseMs);
}

function drive(value) {
  config.drive = clamp(safeNumber(value, config.drive), 0, 0.65);
  emitFx('drive', config.drive);
}

function chorus_mode(value) {
  config.chorusMode = Math.max(0, Math.min(2, Math.round(safeNumber(value, config.chorusMode))));
  if (config.chorusMode === 0) {
    config.chorusMix = 0;
  } else if (config.chorusMode === 1) {
    config.chorusRateHz = 0.48;
    config.chorusDepthMs = 6.4;
    config.chorusMix = Math.max(config.chorusMix, 0.32);
  } else {
    config.chorusRateHz = 0.96;
    config.chorusDepthMs = 4.2;
    config.chorusMix = Math.max(config.chorusMix, 0.38);
  }
  emitFx('chorus_mode', config.chorusMode);
  emitFx('chorus_rate', config.chorusRateHz);
  emitFx('chorus_depth', config.chorusDepthMs);
  emitFx('chorus_mix', config.chorusMix);
  emitUi('chorusMix', config.chorusMix);
}

function chorus_mix(value) {
  config.chorusMix = clamp(safeNumber(value, config.chorusMix), 0, 0.75);
  emitFx('chorus_mix', config.chorusMix);
}

function chorus_rate(value) {
  config.chorusRateHz = clamp(safeNumber(value, config.chorusRateHz), 0.05, 3);
  emitFx('chorus_rate', config.chorusRateHz);
}

function chorus_depth(value) {
  config.chorusDepthMs = clamp(safeNumber(value, config.chorusDepthMs), 0.5, 12);
  emitFx('chorus_depth', config.chorusDepthMs);
}

function delay_division(value) {
  config.delayDivision = String(value || '1/8');
  emitFx('delay_time', delayMs());
}

function delay_feedback(value) {
  config.delayFeedback = clamp(safeNumber(value, config.delayFeedback), 0, 0.7);
  emitFx('delay_feedback', config.delayFeedback);
}

function delay_mix(value) {
  config.delayMix = clamp(safeNumber(value, config.delayMix), 0, 0.5);
  emitFx('delay_mix', config.delayMix);
}

function reverb_time(value) {
  config.reverbTimeMs = clamp(safeNumber(value, config.reverbTimeMs), 250, 10000);
  emitFx('reverb_time', config.reverbTimeMs);
}

function reverb_damp(value) {
  config.reverbDamp = clamp(safeNumber(value, config.reverbDamp), 0, 1);
  emitFx('reverb_damp', config.reverbDamp);
}

function reverb_mix(value) {
  config.reverbMix = clamp(safeNumber(value, config.reverbMix), 0, 0.58);
  emitFx('reverb_mix', config.reverbMix);
}

function output(value) {
  config.output = clamp(safeNumber(value, config.output), 0, 1);
  emitFx('output', config.output);
}

function scene(value) {
  config.scene = String(value || 'neon_drive').toLowerCase().replace(/[ -]+/g, '_');
}

function root_note(value) {
  config.root = Music.normalizeRoot(value);
}

function scale(value) {
  config.scale = String(value || 'minor').toLowerCase().replace(/[ -]+/g, '_');
}

function applyPreset(preset) {
  var synth = preset.synth;
  var fx = preset.fx;
  config.scene = preset.scene;
  config.saw = synth.saw;
  config.pulse = synth.pulse;
  config.sub = synth.sub;
  config.noise = synth.noise;
  config.pwm = synth.pwm;
  config.cutoff = synth.cutoff;
  config.resonance = synth.resonance;
  config.envAmount = synth.envAmount;
  config.attackMs = synth.attackMs;
  config.decayMs = synth.decayMs;
  config.sustain = synth.sustain;
  config.releaseMs = synth.releaseMs;
  config.drive = synth.drive;
  config.chorusMode = fx.chorusMode;
  config.chorusMix = fx.chorusMix;
  config.chorusRateHz = fx.chorusRateHz;
  config.chorusDepthMs = fx.chorusDepthMs;
  config.delayDivision = fx.delayDivision;
  config.delayFeedback = fx.delayFeedback;
  config.delayMix = fx.delayMix;
  config.reverbTimeMs = fx.reverbTimeMs;
  config.reverbDamp = fx.reverbDamp;
  config.reverbMix = fx.reverbMix;
  sendAll();
  emitUiState();
}

function surprise(selectedScene, intensity) {
  lastPreset = Surprise.generatePreset({
    seed: String(new Date().getTime()),
    scene: selectedScene || config.scene || 'auto',
    intensity: intensity === undefined ? 0.82 : clamp(safeNumber(intensity, 0.82), 0.15, 1),
    root: config.root,
    scale: config.scale
  });
  applyPreset(lastPreset);
  outlet(2, 'preset', JSON.stringify(lastPreset));
  emitStatus('surprise ' + lastPreset.scene);
}

function refresh_tempo() {
  emitFx('delay_time', delayMs());
}

function dump() {
  outlet(2, 'config', JSON.stringify(config));
  if (lastPreset) {
    outlet(2, 'preset', JSON.stringify(lastPreset));
  }
}

function loadbang() {
  ensureLiveApi();
  sendAll();
  emitUiState();
  emitStatus('ready');
}
