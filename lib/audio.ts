'use client'

// Self-contained Web Audio API Sound Synthesizer for NovaMind Study App
// Provides zero-dependency, ultra-low-latency premium audio feedback.

let audioCtx: AudioContext | null = null
let mainVolumeNode: GainNode | null = null
let isMutedSetting = false
let currentVolume = 0.4

// Initialize Audio Context on demand (complies with browser autoplay policies)
function getAudioContext(): { ctx: AudioContext; volume: GainNode } | null {
  if (typeof window === 'undefined') return null

  try {
    if (!audioCtx) {
      // Support standard and legacy web audio
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      audioCtx = new AudioContextClass()
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }

    if (!mainVolumeNode && audioCtx) {
      mainVolumeNode = audioCtx.createGain()
      mainVolumeNode.gain.setValueAtTime(isMutedSetting ? 0 : currentVolume, audioCtx.currentTime)
      mainVolumeNode.connect(audioCtx.destination)
    }

    return { ctx: audioCtx, volume: mainVolumeNode! }
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err)
    return null
  }
}

export const StudyAudio = {
  // Volume controls
  setVolume(vol: number) {
    currentVolume = Math.max(0, Math.min(1, vol))
    const audio = getAudioContext()
    if (audio && !isMutedSetting) {
      audio.volume.gain.setTargetAtTime(currentVolume, audio.ctx.currentTime, 0.05)
    }
    // Save locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('novamind_volume', String(currentVolume))
    }
  },

  getVolume() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('novamind_volume')
      if (stored) currentVolume = parseFloat(stored)
    }
    return currentVolume
  },

  setMuted(muted: boolean) {
    isMutedSetting = muted
    const audio = getAudioContext()
    if (audio) {
      audio.volume.gain.setTargetAtTime(muted ? 0 : currentVolume, audio.ctx.currentTime, 0.05)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('novamind_muted', muted ? 'true' : 'false')
    }
  },

  isMuted() {
    if (typeof window !== 'undefined') {
      isMutedSetting = localStorage.getItem('novamind_muted') === 'true'
    }
    return isMutedSetting
  },

  // Play a soft wooden tick sound for card flips
  playFlip() {
    const audio = getAudioContext()
    if (!audio || isMutedSetting) return

    const { ctx, volume } = audio
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(volume)

    // Wood click frequency envelope
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08)

    // Sharp decay
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.09)
  },

  // Play a gorgeous crystal chime chord for correct responses / Got It!
  playCorrect() {
    const audio = getAudioContext()
    if (!audio || isMutedSetting) return

    const { ctx, volume } = audio
    const now = ctx.currentTime

    // We will build a beautiful ascending major chord arpeggio
    const notes = [329.63, 392.00, 523.25] // E4, G4, C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(volume)
      
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)
      
      // Add subtle frequency vibrato
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 8 // 8Hz vibrato
      lfoGain.gain.value = 4
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.06 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6)
      
      lfo.start(now)
      osc.start(now + idx * 0.06)
      
      lfo.stop(now + idx * 0.06 + 0.6)
      osc.stop(now + idx * 0.06 + 0.6)
    })
  },

  // Play a soft, comforting low-pass harmonic sweep for incorrect answers / Still Learning
  playIncorrect() {
    const audio = getAudioContext()
    if (!audio || isMutedSetting) return

    const { ctx, volume } = audio
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(volume)

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(196, now) // G3
    osc.frequency.exponentialRampToValueAtTime(130.81, now + 0.3) // Down to C3

    // Low-pass filter to keep it soft and organic
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(800, now)
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.3)

    gain.gain.setValueAtTime(0.35, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.start(now)
    osc.stop(now + 0.4)
  },

  // Play a soft hover bubble sound
  playHover() {
    const audio = getAudioContext()
    if (!audio || isMutedSetting) return

    const { ctx, volume } = audio
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(volume)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.05)

    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.06)
  },

  // Play a stunning celestial transition sweep when views change
  playTransition() {
    const audio = getAudioContext()
    if (!audio || isMutedSetting) return

    const { ctx, volume } = audio
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(volume)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.4)

    filter.type = 'highpass'
    filter.frequency.setValueAtTime(100, now)
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.4)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.15)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    osc.start(now)
    osc.stop(now + 0.5)
  },

  // Play a full triumphant study set victory chime arpeggio
  playSuccess() {
    const audio = getAudioContext()
    if (!audio || isMutedSetting) return

    const { ctx, volume } = audio
    const now = ctx.currentTime
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50] // C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(volume)
      
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.065)
      
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.065 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.8)
      
      osc.start(now + idx * 0.065)
      osc.stop(now + idx * 0.065 + 0.85)
    })
  }
}
