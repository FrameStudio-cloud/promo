let ctx: AudioContext | null = null;

/** Three short tones when a session ends. No-ops if audio is blocked. */
export function playChime(): void {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx ??= new Ctx();
    const audio = ctx;
    void audio.resume?.().catch(() => undefined);

    [0, 0.22, 0.44].forEach((offset) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.0001, audio.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + offset + 0.18);
      osc.connect(gain).connect(audio.destination);
      osc.start(audio.currentTime + offset);
      osc.stop(audio.currentTime + offset + 0.2);
    });
  } catch {
    /* audio blocked — ignore */
  }
}
