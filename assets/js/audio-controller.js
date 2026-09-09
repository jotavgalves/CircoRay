const DEFAULT_TRACK = '/assets/audio/Trim_VtA_Twisted%20Carousel_1_1.mp3';

export function initGameAudio(config = {}) {
  if (window.__circorayAudioLoaded) return;
  window.__circorayAudioLoaded = true;

  const configured = String(config?.audio?.src || '').trim();
  const src = !configured || configured === '/michak-whatsapp.mp3' ? DEFAULT_TRACK : configured;
  const audio = new Audio(src);
  audio.loop = config?.audio?.loop !== false;
  const baseVolume = Math.min(1, Math.max(0, Number(config?.audio?.volume ?? 0.3)));
  audio.volume = baseVolume;
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

  window.addEventListener('circoray:tension', (event) => {
    const value = Math.min(100, Math.max(0, Number(event.detail?.value || 0)));
    const hardcore = Boolean(window.__circorayHardcoreArmed);
    const fury = Boolean(window.__circorayHardcoreFury);
    const targetRate = fury ? 1.075 : hardcore ? 1.045 : 1 + (value / 100) * 0.018;
    const targetVolume = Math.min(1, baseVolume * (1 + value * 0.0022));
    try {
      audio.playbackRate = targetRate;
      audio.volume = targetVolume;
    } catch {}
  });

  window.addEventListener('circoray:hardcore-armed', () => {
    try {
      audio.playbackRate = 0.92;
      setTimeout(() => { audio.playbackRate = window.__circorayHardcoreFury ? 1.075 : 1.045; }, 900);
    } catch {}
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (started) audio.play().catch(() => {});
  });
}
