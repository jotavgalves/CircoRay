const DEFAULT_TRACK = '/assets/audio/Trim_VtA_Twisted%20Carousel_1_1.mp3';

export function initGameAudio(config = {}) {
  if (window.__circorayAudioLoaded) return;
  window.__circorayAudioLoaded = true;

  const configured = String(config?.audio?.src || '').trim();
  const src = !configured || configured === '/michak-whatsapp.mp3' ? DEFAULT_TRACK : configured;
  const audio = new Audio(src);
  audio.loop = config?.audio?.loop !== false;
  audio.volume = Math.min(1, Math.max(0, Number(config?.audio?.volume ?? 0.3)));
  audio.preload = 'auto';
  window.CIRCO_BACKGROUND_AUDIO = audio;

  let started = false;
  async function start() {
    if (started) return;
    try {
      await audio.play();
      started = true;
      cleanup();
    } catch {
      // Browser autoplay policy: keep listeners until a real user gesture succeeds.
    }
  }
  function cleanup() {
    window.removeEventListener('pointerdown', start, true);
    window.removeEventListener('touchstart', start, true);
    window.removeEventListener('keydown', start, true);
  }

  window.addEventListener('pointerdown', start, true);
  window.addEventListener('touchstart', start, true);
  window.addEventListener('keydown', start, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (started) audio.play().catch(() => {});
  });
}
