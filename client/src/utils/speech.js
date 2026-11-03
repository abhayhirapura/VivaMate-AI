// Browser Web Speech API utilities

export const SPEECH_SUPPORTED = typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export const TTS_SUPPORTED = typeof window !== 'undefined' && 'speechSynthesis' in window;

const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

export function getLang(language) {
  if (language === 'Hindi' || language === 'Hinglish') return 'hi-IN';
  return 'en-IN';
}

export function createRecognizer(language, onResult, onEnd, onError) {
  if (!SPEECH_SUPPORTED || !SR) return null;
  const rec = new SR();
  rec.lang = getLang(language);
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript)
      .join('');
    const isFinal = e.results[e.results.length - 1].isFinal;
    onResult(transcript, isFinal);
  };
  rec.onend = onEnd;
  rec.onerror = (e) => {
    // not-allowed = mic permission denied
    onError(e.error);
  };
  return rec;
}

export function speak(text, language, onEnd) {
  if (!TTS_SUPPORTED) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = getLang(language);
  utter.rate = 0.92;
  utter.pitch = 1.0;

  // Try to find a matching voice; fall back gracefully
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === utter.lang);
  if (preferred) {
    utter.voice = preferred;
  } else if (utter.lang !== 'en-IN') {
    // No hi-IN voice installed — fall back to en-US/en-IN
    const fallback = voices.find(v => v.lang.startsWith('en'));
    if (fallback) utter.voice = fallback;
    utter.lang = 'en-US';
    console.warn('hi-IN TTS voice not available, using English fallback.');
  }

  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (TTS_SUPPORTED) window.speechSynthesis.cancel();
}
