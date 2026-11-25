import { useCallback, useEffect, useRef } from 'react'

const cues = {
  depart: [392, 523],
  arrived: [523, 659],
  spray: [294, 330, 294],
  clear: [523, 659, 784],
  complete: [523, 659, 784, 1047],
}

export function useMazeAudio(enabled: boolean) {
  const audio = useRef<AudioContext | null>(null)
  const allowed = useRef(enabled)
  const stop = useCallback(() => {
    const ctx = audio.current
    audio.current = null
    if (ctx) void ctx.close().catch(() => {})
  }, [])
  useEffect(() => {
    allowed.current = enabled
    if (!enabled) stop()
    return stop
  }, [enabled, stop])
  const play = useCallback((cue: keyof typeof cues) => {
    if (!allowed.current) return
    try {
      const ctx = audio.current ??= new AudioContext()
      void ctx.resume().catch(() => {})
      for (const [i, hz] of cues[cue].entries()) {
        const time = ctx.currentTime + i * .095
        const node = ctx.createOscillator(), volume = ctx.createGain()
        node.frequency.value = hz
        volume.gain.setValueAtTime(.035, time)
        volume.gain.exponentialRampToValueAtTime(.001, time + .12)
        node.connect(volume).connect(ctx.destination)
        node.start(time)
        node.stop(time + .13)
      }
    } catch { /* Audio is optional when a browser cannot play a cue. */ }
  }, [])
  return { play, stop }
}
