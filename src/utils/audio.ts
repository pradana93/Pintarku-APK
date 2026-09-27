/**
 * Audio Synthesizer and Indonesian Female Speech Engine
 */
import { Capacitor } from '@capacitor/core';
import { QueueStrategy, TextToSpeech } from '@capacitor-community/text-to-speech';

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Play sound effects using Web Audio API
 */
export function playSound(type: 'click' | 'correct' | 'wrong' | 'star' | 'victory' | 'badge' | 'pop' | 'jump' | 'apple') {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'jump') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'apple') {
      // Pleasant crunch/pickup chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'click' || type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'pop' ? 520 : 400, now);
      osc.frequency.exponentialRampToValueAtTime(type === 'pop' ? 880 : 300, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'correct') {
      // Cheerful chime: C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'wrong') {
      // Gentle boing (low frequency)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'star') {
      // Magic sparkle
      const freqs = [659.25, 880, 1174.66, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.3, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } else if (type === 'victory' || type === 'badge') {
      // Fanfare: C5, G5, C6, E6, G6
      const fanfare = [
        { f: 523.25, t: 0, d: 0.15 },
        { f: 659.25, t: 0.12, d: 0.15 },
        { f: 783.99, t: 0.24, d: 0.15 },
        { f: 1046.5, t: 0.36, d: 0.45 },
      ];
      fanfare.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.3, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + n.d);
      });
    }
  } catch (err) {
    console.warn('Audio effect error:', err);
  }
}

/**
 * Text-to-Speech specifically tuned for Indonesian Female voice ("Suara Perempuan")
 *
 * On native Android (Capacitor APK) this uses the native TextToSpeech plugin,
 * because WebView speechSynthesis often has no usable voices and stays silent.
 * On web it falls back to the browser speechSynthesis implementation below.
 */
export function speakIndonesian(text: string, rate = 0.85): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    return speakNativeIndonesian(text, rate);
  }
  return speakWebIndonesian(text, rate);
}

async function speakNativeIndonesian(text: string, rate = 0.85): Promise<void> {
  try {
    await TextToSpeech.stop();
  } catch {
    // ignore stop errors when nothing is playing
  }
  try {
    await TextToSpeech.speak({
      text,
      lang: 'id-ID',
      rate,
      pitch: 1.15,
      volume: 1.0,
      queueStrategy: QueueStrategy.Flush,
    });
  } catch (err) {
    console.warn('Native TTS error:', err);
  }
}

function speakWebIndonesian(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    // Slightly higher pitch gives a cheerful, warm Indonesian female teacher voice
    utterance.pitch = 1.35;
    utterance.rate = rate; // slightly slower for clear comprehension for kids

    // Try finding an Indonesian female voice or general female voice
    const voices = window.speechSynthesis.getVoices();
    const idVoices = voices.filter(v => v.lang.startsWith('id') || v.lang.includes('ID'));
    const femaleIdVoice = idVoices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('perempuan') || 
      v.name.toLowerCase().includes('gadis') ||
      v.name.toLowerCase().includes('siti') ||
      v.name.toLowerCase().includes('indonesia')
    );

    if (femaleIdVoice) {
      utterance.voice = femaleIdVoice;
    } else if (idVoices.length > 0) {
      utterance.voice = idVoices[0];
    } else {
      // Fallback: any voice with Indonesian tag or default with female pitch
      const fallbackFemale = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('zira') || 
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('yuna')
      );
      if (fallbackFemale) {
        utterance.voice = fallbackFemale;
      }
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

// Pre-load voices on startup
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // voices cached
  };
}
