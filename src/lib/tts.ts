import { type Language } from './languages'

let voicesLoaded = false

function getVoice(ttsLang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  // Prefer exact match, then same language prefix (e.g. 'te' from 'te-IN')
  return (
    voices.find(v => v.lang === ttsLang) ??
    voices.find(v => v.lang.startsWith(ttsLang.split('-')[0] + '-')) ??
    voices.find(v => v.lang.startsWith(ttsLang.split('-')[0])) ??
    null
  )
}

export function speakNumber(n: number, lang: Language): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const say = () => {
    const utterance = new SpeechSynthesisUtterance(String(n))
    utterance.lang = lang.ttsLang
    utterance.rate = 0.85
    utterance.pitch = 1.0
    utterance.volume = 1.0

    const voice = getVoice(lang.ttsLang)
    if (voice) utterance.voice = voice

    window.speechSynthesis.speak(utterance)
  }

  // Voices load asynchronously on first call; wait for them if not yet ready
  if (voicesLoaded || window.speechSynthesis.getVoices().length > 0) {
    voicesLoaded = true
    say()
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true
      window.speechSynthesis.onvoiceschanged = null
      say()
    }
  }
}

export function cancelSpeech(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
