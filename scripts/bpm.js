// Front-end JS port of your Rust TapState (no deps).
// Keeps the same quirks as the original JS you referenced:
// - reset if gap > 5000ms
// - start_ts set at 5 taps (stored but not used)
// - keep at most 24 taps (shift oldest)
// - per-interval bpm is rounded to 2 decimals
// - average of last up to 5 intervals BUT divides by 5 always
// - only outputs once there are >= 2 intervals
// - bpm clamped to [0, 600]
// - ms clamped to [0.01, 5.0] and rounded to 2 decimals for display

const BPM_PRECISION = 5;
const RESET_GAP_MS = 5000;
const MAX_TAPS = 24;

function round2(x) {
  return Math.round(x * 100) / 100;
}

// Rust em(blood_moon, forest_minion, coal)
function em(bloodMoon, forestMinion, coal) {
  return (bloodMoon || coal ? 1.15 : 1.0) * (forestMinion ? 1.05 : 1.0);
}

// Rust bpm_to_speed_idx2
function bpmToSpeedIdx2(bpm, bloodMoon, forestMinion, coal) {
  const e = em(bloodMoon, forestMinion, coal);
  return bpm / (1.0 * e * (60.0 + bpm * 0.075));
}

// Rust get_bpm_average (divide by 5 even if fewer samples)
function getBpmAverage(avgTaps) {
  let sum = 0;
  let taken = 0;
  for (let i = avgTaps.length - 1; i >= 0; i--) {
    sum += avgTaps[i];
    taken++;
    if (taken >= BPM_PRECISION) break;
  }
  return sum / BPM_PRECISION;
}

class TapState {
  constructor() {
    this.taps = [];     // array of timestamps (ms)
    this.start_ts = null;
  }

  reset() {
    this.taps.length = 0;
    this.start_ts = null;
  }

  // Returns: null OR { bpm: number, ms: number }
  tapAndCompute(opts = {}) {
    const now = performance.now(); // ms, monotonic like Rust Instant

    // reset if gap > 5000ms since last tap
    const last = this.taps.length ? this.taps[this.taps.length - 1] : null;
    if (last != null && (now - last) > RESET_GAP_MS) {
      this.reset();
    }

    this.taps.push(now);

    // start_ts when taps.length == 5
    if (this.taps.length === 5) {
      this.start_ts = this.taps[this.taps.length - 1];
    }

    // keep at most 24 taps (shift oldest)
    if (this.taps.length >= MAX_TAPS) {
      this.taps.shift();
    }

    // build avg_taps from consecutive intervals
    const avgTaps = [];
    if (this.taps.length >= 2) {
      for (let i = 1; i < this.taps.length; i++) {
        const dtSec = (this.taps[i] - this.taps[i - 1]) / 1000;
        if (dtSec > 0) {
          const bpm_i = round2(60 / dtSec);
          avgTaps.push(bpm_i);
        }
      }
    }

    // only output when avg_taps.length >= 2
    if (avgTaps.length < 2) return null;

    // average (quirky divide-by-5)
    let bpm = getBpmAverage(avgTaps);

    // cap bpm at 600 and floor at 0
    if (bpm > 600) bpm = 600;
    if (bpm < 0) bpm = 0;

    // options (match your Rust hardcoded defaults unless provided)
    const {
      offsetPct = 0.0,
      bloodMoon = false,
      forestMinion = false,
      coal = false,
    } = opts;

    const bpmAdj = bpm / (1 + offsetPct / 100);

    // speed idx=2 (100%)
    let ms = bpmToSpeedIdx2(bpmAdj, bloodMoon, forestMinion, coal);

    if (ms < 0) ms = 0.01;
    if (ms > 5.0) ms = 5.0;

    const bpmDisplay = Math.min(600, Math.max(0, Math.round(bpm)));
    const msDisplay = round2(ms);

    return { bpm: bpmDisplay, ms: msDisplay };
  }
}

/*
Example usage (front-end):

import { TapState } from './tap.js';
const state = new TapState();

window.addEventListener('keydown', (e) => {
  if (e.code === 'Digit4') {
    const out = state.tapAndCompute(); // or tapAndCompute({ bloodMoon: true })
    if (out) {
      console.log(`BPM: ${out.bpm}  m/s: ${out.ms.toFixed(2)}`);
    }
  }
});
*/
