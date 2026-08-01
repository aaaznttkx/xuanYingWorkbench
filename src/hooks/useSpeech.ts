import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechState {
  isPlaying: boolean;
  isSupported: boolean;
  error: string | null;
  voicesLoaded: boolean;
}

const LANG = 'en-US';
const RATE = 0.85;

export default function useSpeech() {
  const [state, setState] = useState<SpeechState>({
    isPlaying: false,
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    error: null,
    voicesLoaded: false,
  });

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const primedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload voices on mount (critical for iOS)
  useEffect(() => {
    if (!state.isSupported) return;

    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synthRef.current!.getVoices();
      if (voices.length > 0) {
        setState(prev => ({ ...prev, voicesLoaded: true }));
      }
    };

    // iOS: voices may load after initial call
    loadVoices();
    synthRef.current.addEventListener('voiceschanged', loadVoices);

    // iOS workaround: prime speech synthesis with a silent utterance
    // This "wakes up" the API after a user gesture
    const primeSpeech = () => {
      if (primedRef.current || !synthRef.current) return;
      primedRef.current = true;

      try {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        u.rate = 1;
        synthRef.current.speak(u);
      } catch {
        // Priming failed silently - will try again on first real speak
      }
    };

    // Prime on first user interaction
    const events = ['click', 'touchstart', 'touchend'];
    events.forEach(evt => document.addEventListener(evt, primeSpeech, { once: true }));

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (synthRef.current) {
        synthRef.current.removeEventListener('voiceschanged', loadVoices);
        synthRef.current.cancel();
      }
      events.forEach(evt => document.removeEventListener(evt, primeSpeech));
    };
  }, [state.isSupported]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!text.trim() || !synthRef.current || !state.isSupported) {
      setState(prev => ({ ...prev, error: '您的浏览器不支持语音播放' }));
      return;
    }

    const synth = synthRef.current;

    // Clean up previous state
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    synth.cancel();
    setState(prev => ({ ...prev, isPlaying: false, error: null }));

    // iOS fix: small delay after cancel before speaking
    const delay = isIOS() ? 80 : 10;

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG;
      utterance.rate = RATE;
      utterance.volume = 1;
      utteranceRef.current = utterance;

      // Try to select a good English voice
      const voices = synth.getVoices();
      const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha'))
        || voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
        || voices.find(v => v.lang.startsWith('en-US'))
        || voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;

      let hasEnded = false;

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isPlaying: true, error: null }));
      };

      utterance.onend = () => {
        hasEnded = true;
        setState(prev => ({ ...prev, isPlaying: false }));
        onEnd?.();
      };

      utterance.onerror = (e) => {
        // iOS: 'canceled' error during cancel() is expected
        if (e.error === 'canceled' || e.error === 'interrupted') return;

        console.warn('Speech error:', e.error);

        // iOS silent failure: no error event fires, but nothing plays
        // Retry once after a longer delay
        if (!hasEnded && !retryTimerRef.current) {
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            synth.cancel();
            setState(prev => ({ ...prev, isPlaying: false }));
            // Create a fresh utterance and retry
            const retryUtt = new SpeechSynthesisUtterance(text);
            retryUtt.lang = LANG;
            retryUtt.rate = RATE;
            retryUtt.volume = 1;
            if (enVoice) retryUtt.voice = enVoice;
            retryUtt.onstart = () => setState(prev => ({ ...prev, isPlaying: true, error: null }));
            retryUtt.onend = () => { setState(prev => ({ ...prev, isPlaying: false })); onEnd?.(); };
            retryUtt.onerror = () => {
              setState(prev => ({
                ...prev,
                isPlaying: false,
                error: '播放失败，请点击重试（iOS 用户请确保未开启静音模式）'
              }));
            };
            synth.speak(retryUtt);
          }, 300);
        }
      };

      // iOS workaround: pause and resume to kickstart audio
      // Necessary because iOS blocks audio without explicit user activation
      synth.speak(utterance);
      if (isIOS()) {
        synth.pause();
        synth.resume();
      }

      // Safety timeout: if onend/onerror never fire (iOS bug), reset state
      const estimatedDuration = (text.length / 10) * 1000 + 3000;
      setTimeout(() => {
        if (!hasEnded && utteranceRef.current === utterance) {
          setState(prev => ({ ...prev, isPlaying: false, error: '播放超时，请重试' }));
        }
      }, estimatedDuration);
    };

    setTimeout(doSpeak, delay);
  }, [state.isSupported]);

  const cancel = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (synthRef.current) synthRef.current.cancel();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  return { ...state, speak, cancel };
}

// Detect iOS for workarounds
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
