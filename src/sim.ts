// Headless-simulation config + run-end signal. Every gameplay hook that reads this is guarded by
// `if (sim.active)`, and `active` defaults to false, so normal play is completely unaffected: with
// `active` false none of the sim branches run. The Task-3 batch runner flips `active` on, sets a
// reward policy + `onRunEnd` callback (and optionally a seed), drives N runs, then reads stats.
import type { RunStat } from './stats'

export const sim = {
  active: false,
  // How auto-resolved reward screens pick: 'skip' takes the gold (existing skip path);
  // 'first' applies the first non-gold choice reward (mirrors clicking [data-i="0"]).
  rewardPolicy: 'skip' as 'skip' | 'first',
  // Called by showWin/showGameOver with the recorded RunStat instead of showing a results modal.
  onRunEnd: null as ((stat: RunStat) => void) | null,
  // Optional reproducible RNG: when a number is set, utils.rnd() seeds its LCG from it for the next
  // run (applied via applySimSeed); leave null to keep the Math.random()-seeded behaviour.
  seed: null as number | null,
}
