// Module-level pool — preloaded once per language, reused across calls
let loadedLang = ''
const pool: Record<number, HTMLAudioElement> = {}

export function preloadAudio(langCode: string): void {
  if (langCode === loadedLang) return

  // Release old pool
  for (let i = 1; i <= 90; i++) {
    if (pool[i]) { pool[i].src = ''; delete pool[i] }
  }

  loadedLang = langCode

  for (let i = 1; i <= 90; i++) {
    const a = new Audio(`/audio/${langCode}/${i}.mp3`)
    a.preload = 'auto'
    pool[i] = a
  }
}

export function playAudio(n: number): void {
  const a = pool[n]
  if (!a) return
  a.currentTime = 0
  a.play().catch(() => {/* autoplay policy — user gesture required on first play */})
}

export function stopAudio(): void {
  const a = pool[loadedLang ? 1 : 0]
  if (a) { a.pause(); a.currentTime = 0 }
}
