/**
 * Sound for the volunteer quiz's "Spin hjulet" reel, synthesised with the Web
 * Audio API.
 *
 * Synthesising instead of shipping an audio file means no extra request and no
 * bundle weight, and it lets the ratchet ticks follow the reel's own
 * deceleration curve (`cubic-bezier(0.1, 0.6, 0.1, 1)` in
 * `ValgomatenInfobox`) instead of an approximated loop.
 */

const TICK_START_MS = 24
const TICK_END_MS = 190
const TICK_START_GAIN = 0.3
const TICK_END_GAIN = 0.12
const TICK_DECAY_S = 0.045
const TICK_BAND_HZ = 2300
const TICK_STOP_RATIO = 0.96
const MAX_TICKS = 240

const WHIRR_START_HZ = 165
const WHIRR_END_HZ = 58
const WHIRR_START_FILTER_HZ = 2100
const WHIRR_END_FILTER_HZ = 420
const WHIRR_GAIN = 0.16
const WHIRR_LFO_START_HZ = 26
const WHIRR_LFO_END_HZ = 5.5
const WHIRR_TREMOLO_BASE = 0.65
const WHIRR_TREMOLO_DEPTH = 0.3

const CELEBRATION_NOTES_HZ = [523.25, 659.25, 783.99, 1046.5]
const CELEBRATION_STEP_S = 0.085
const CELEBRATION_GAIN = 0.18
const CELEBRATION_DECAY_S = 0.38

const NOISE_SECONDS = 0.05
const FLOOR_GAIN = 0.0001
const STOP_RAMP_S = 0.04
/** A spin never quite reaches its final frame, so the reel decelerates last. */
const SPIN_DECELERATION = 3

export type SpinTick = {
  /** Milliseconds after the spin started. */
  atMs: number
  /** Peak gain for this tick. */
  gain: number
}

export type WheelSpinSound = {
  /** Schedule the whirr and ratchet ticks for a spin of `durationMs`. */
  start: (durationMs: number) => void
  /** Play the short jingle for a landed winner. */
  celebrate: () => void
  /** Silence everything and release the scheduled nodes. */
  stop: () => void
  /** Close the audio context; call on unmount. */
  dispose: () => void
}

type AudioContextConstructor = new () => AudioContext

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null
  const candidate = globalThis as typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor
  }
  return candidate.AudioContext ?? candidate.webkitAudioContext ?? null
}

export function isWheelSpinSoundSupported(): boolean {
  return getAudioContextConstructor() !== null
}

/**
 * Ratchet tick positions for one spin. The reel covers most of its distance
 * early, so the ticks start tight and stretch out as it slows down.
 */
export function spinTicks(durationMs: number): SpinTick[] {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return []

  const ticks: SpinTick[] = []
  let elapsed = 0

  while (ticks.length < MAX_TICKS) {
    const progress = Math.min(elapsed / durationMs, 1)
    ticks.push({
      atMs: elapsed,
      gain: TICK_START_GAIN + (TICK_END_GAIN - TICK_START_GAIN) * progress,
    })
    if (progress >= TICK_STOP_RATIO) break

    const deceleration = 1 - (1 - progress) ** SPIN_DECELERATION
    elapsed += TICK_START_MS + (TICK_END_MS - TICK_START_MS) * deceleration
  }

  return ticks
}

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * NOISE_SECONDS))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let index = 0; index < length; index += 1) {
    channel[index] = Math.random() * 2 - 1
  }
  return buffer
}

function scheduleWhirr(
  context: AudioContext,
  destination: AudioNode,
  active: AudioScheduledSourceNode[],
  startAt: number,
  durationMs: number,
): void {
  const endAt = startAt + durationMs / 1000

  const motor = context.createOscillator()
  motor.type = "sawtooth"
  motor.frequency.setValueAtTime(WHIRR_START_HZ, startAt)
  motor.frequency.exponentialRampToValueAtTime(WHIRR_END_HZ, endAt)

  const filter = context.createBiquadFilter()
  filter.type = "lowpass"
  filter.Q.value = 6
  filter.frequency.setValueAtTime(WHIRR_START_FILTER_HZ, startAt)
  filter.frequency.exponentialRampToValueAtTime(WHIRR_END_FILTER_HZ, endAt)

  const body = context.createGain()
  body.gain.setValueAtTime(0, startAt)
  body.gain.linearRampToValueAtTime(WHIRR_GAIN, startAt + 0.18)
  body.gain.setValueAtTime(WHIRR_GAIN, endAt - 0.45)
  body.gain.exponentialRampToValueAtTime(FLOOR_GAIN, endAt)

  // Tremolo that slows down with the reel, so the whirr reads as a spinning
  // mechanism instead of a static drone.
  const tremolo = context.createGain()
  tremolo.gain.value = WHIRR_TREMOLO_BASE
  const lfo = context.createOscillator()
  lfo.type = "sine"
  lfo.frequency.setValueAtTime(WHIRR_LFO_START_HZ, startAt)
  lfo.frequency.exponentialRampToValueAtTime(WHIRR_LFO_END_HZ, endAt)
  const lfoDepth = context.createGain()
  lfoDepth.gain.value = WHIRR_TREMOLO_DEPTH
  lfo.connect(lfoDepth)
  lfoDepth.connect(tremolo.gain)

  motor.connect(filter)
  filter.connect(body)
  body.connect(tremolo)
  tremolo.connect(destination)

  motor.start(startAt)
  lfo.start(startAt)
  motor.stop(endAt + 0.05)
  lfo.stop(endAt + 0.05)
  active.push(motor, lfo)
}

function scheduleTicks(
  context: AudioContext,
  destination: AudioNode,
  active: AudioScheduledSourceNode[],
  startAt: number,
  durationMs: number,
): void {
  const noise = createNoiseBuffer(context)

  for (const tick of spinTicks(durationMs)) {
    const at = startAt + tick.atMs / 1000
    const source = context.createBufferSource()
    source.buffer = noise
    const band = context.createBiquadFilter()
    band.type = "bandpass"
    band.frequency.value = TICK_BAND_HZ
    band.Q.value = 1.1
    const gain = context.createGain()
    gain.gain.setValueAtTime(tick.gain, at)
    gain.gain.exponentialRampToValueAtTime(FLOOR_GAIN, at + TICK_DECAY_S)

    source.connect(band)
    band.connect(gain)
    gain.connect(destination)
    source.start(at)
    source.stop(at + TICK_DECAY_S + 0.01)
    active.push(source)
  }
}

function scheduleCelebration(
  context: AudioContext,
  destination: AudioNode,
  active: AudioScheduledSourceNode[],
  startAt: number,
): void {
  CELEBRATION_NOTES_HZ.forEach((frequency, index) => {
    const at = startAt + index * CELEBRATION_STEP_S
    const note = context.createOscillator()
    note.type = "triangle"
    note.frequency.value = frequency
    const gain = context.createGain()
    gain.gain.setValueAtTime(FLOOR_GAIN, at)
    gain.gain.exponentialRampToValueAtTime(CELEBRATION_GAIN, at + 0.015)
    gain.gain.exponentialRampToValueAtTime(FLOOR_GAIN, at + CELEBRATION_DECAY_S)

    note.connect(gain)
    gain.connect(destination)
    note.start(at)
    note.stop(at + CELEBRATION_DECAY_S + 0.02)
    active.push(note)
  })
}

/**
 * Lazily creates a single audio context and reuses it for every spin, since
 * browsers only allow a context to be resumed from a user gesture — opening
 * the quiz and pressing "RULL" is that gesture.
 */
export function createWheelSpinSound(): WheelSpinSound {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let active: AudioScheduledSourceNode[] = []

  const ensureContext = (): AudioContext | null => {
    if (context) return context
    const Constructor = getAudioContextConstructor()
    if (!Constructor) return null
    try {
      context = new Constructor()
    } catch {
      // Some browsers block context creation outright; the quiz works silently.
      return null
    }
    return context
  }

  const stop = (): void => {
    const current = context
    if (current && master) {
      const now = current.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.exponentialRampToValueAtTime(FLOOR_GAIN, now + STOP_RAMP_S)
    }
    for (const node of active) {
      try {
        node.stop()
      } catch {
        // Already stopped by its own schedule; nothing to do.
      }
      node.disconnect()
    }
    active = []
    master = null
  }

  const start = (durationMs: number): void => {
    const audioContext = ensureContext()
    if (!audioContext || !Number.isFinite(durationMs) || durationMs <= 0) return

    stop()
    void audioContext.resume().catch(() => {
      // Autoplay policy refused playback; fail silent rather than loud.
    })

    const startAt = audioContext.currentTime
    master = audioContext.createGain()
    master.gain.value = 1
    master.connect(audioContext.destination)

    scheduleWhirr(audioContext, master, active, startAt, durationMs)
    scheduleTicks(audioContext, master, active, startAt, durationMs)
  }

  const celebrate = (): void => {
    const audioContext = ensureContext()
    if (!audioContext) return
    if (!master) {
      master = audioContext.createGain()
      master.gain.value = 1
      master.connect(audioContext.destination)
    }
    scheduleCelebration(audioContext, master, active, audioContext.currentTime)
  }

  const dispose = (): void => {
    stop()
    const current = context
    context = null
    if (current) {
      void current.close().catch(() => {
        // A context that is already closed throws here; nothing to release.
      })
    }
  }

  return { start, celebrate, stop, dispose }
}
