function setupAudioUi() {
  volumeSlider.value = Math.round(audioState.volume * 100);
  soundButton.textContent = audioState.enabled ? '音效' : '靜音';
  soundButton.classList.toggle('muted', !audioState.enabled);
}

function ensureAudio() {
  if (audioState.context) {
    audioState.context.resume?.();
    ensureBackgroundMusic();
    return audioState.context;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  const context = new AudioContext();
  audioState.context = context;
  audioState.master = context.createGain();
  audioState.musicGain = context.createGain();
  audioState.sfxGain = context.createGain();
  audioState.master.gain.value = audioState.enabled ? 1 : 0;
  audioState.musicGain.gain.value = audioState.volume;
  audioState.sfxGain.gain.value = 0.85;
  audioState.musicGain.connect(audioState.master);
  audioState.sfxGain.connect(audioState.master);
  audioState.master.connect(context.destination);
  ensureBackgroundMusic();
  return context;
}

function ensureBackgroundMusic() {
  if (!audioState.context || audioState.musicSource) return;

  const music = new Audio(BACKGROUND_MUSIC_SRC);
  music.loop = true;
  music.preload = 'auto';
  audioState.musicElement = music;
  audioState.musicSource = audioState.context.createMediaElementSource(music);
  audioState.musicSource.connect(audioState.musicGain);
}

function updateAudioVolume() {
  if (audioState.master) {
    audioState.master.gain.setTargetAtTime(audioState.enabled ? 1 : 0, audioState.context.currentTime, 0.025);
  }
  if (audioState.musicGain) {
    audioState.musicGain.gain.setTargetAtTime(audioState.volume, audioState.context.currentTime, 0.025);
  }
  soundButton.textContent = audioState.enabled ? '音效' : '靜音';
  soundButton.classList.toggle('muted', !audioState.enabled);
  localStorage.setItem('veggieMergeSoundEnabled', String(audioState.enabled));
  localStorage.setItem('veggieMergeVolume', String(audioState.volume));
}

function makeOsc({ frequency, type = 'sine', gain = 0.2, start = 0, duration = 0.2, target = null }) {
  const context = ensureAudio();
  const output = target || audioState.sfxGain;
  if (!context || !output || !audioState.enabled) return;

  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const now = context.currentTime + start;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), now + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.04);
  return oscillator;
}

function playClickSound() {
  makeOsc({ frequency: 520, type: 'triangle', gain: 0.08, duration: 0.08 });
}

function playDropSound(level = 0) {
  makeOsc({ frequency: 180 + level * 24, type: 'triangle', gain: 0.14, duration: 0.11 });
  makeOsc({ frequency: 90, type: 'sine', gain: 0.06, start: 0.02, duration: 0.12 });
}

function playMergeSound(combo = 1, level = 0) {
  const base = 300 + level * 28 + Math.min(combo, 18) * 16;
  makeOsc({ frequency: base, type: 'sawtooth', gain: 0.13, duration: 0.12 });
  makeOsc({ frequency: base * 1.5, type: 'triangle', gain: 0.1, start: 0.05, duration: 0.16 });
  makeOsc({ frequency: base * 2, type: 'sine', gain: 0.08, start: 0.12, duration: 0.18 });
  playComboImpactSound(combo);
}

function playComboImpactSound(combo = 1) {
  const context = ensureAudio();
  if (!context || !audioState.enabled) return;

  const now = context.currentTime;
  const punch = context.createOscillator();
  const punchGain = context.createGain();
  punch.type = 'square';
  punch.frequency.setValueAtTime(86 + Math.min(combo, 20) * 3, now);
  punch.frequency.exponentialRampToValueAtTime(38, now + 0.16);
  punchGain.gain.setValueAtTime(Math.min(0.34, 0.16 + combo * 0.012), now);
  punchGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  punch.connect(punchGain);
  punchGain.connect(audioState.sfxGain);
  punch.start(now);
  punch.stop(now + 0.22);

  const burst = context.createBufferSource();
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.12), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade * fade;
  }
  const filter = context.createBiquadFilter();
  const burstGain = context.createGain();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(700 + Math.min(combo, 20) * 45, now);
  filter.Q.value = 5;
  burstGain.gain.setValueAtTime(0.08, now);
  burstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  burst.buffer = buffer;
  burst.connect(filter);
  filter.connect(burstGain);
  burstGain.connect(audioState.sfxGain);
  burst.start(now);

  navigator.vibrate?.(Math.min(80, 24 + combo * 3));
}

function playGameOverSound() {
  makeOsc({ frequency: 240, type: 'triangle', gain: 0.14, duration: 0.18 });
  makeOsc({ frequency: 180, type: 'triangle', gain: 0.12, start: 0.14, duration: 0.22 });
  makeOsc({ frequency: 120, type: 'sine', gain: 0.12, start: 0.34, duration: 0.34 });
}

function startMusic() {
  const context = ensureAudio();
  if (!context || !audioState.musicElement || !audioState.enabled || !state.hasStarted || state.gameOver) return;

  audioState.musicElement.play().catch(() => {});
}

function stopMusic() {
  if (audioState.musicElement) {
    audioState.musicElement.pause();
  }
}
