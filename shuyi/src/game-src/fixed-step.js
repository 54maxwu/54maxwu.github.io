export class FixedStep {
  constructor(step = .01, limit = 4) { this.step = step; this.limit = limit; this.reset(); }
  reset() { this.remaining = 0; }
  advance(dt, run) {
    this.remaining += Math.max(0, dt);
    const available = Math.floor((this.remaining + 1e-9) / this.step);
    const count = Math.min(this.limit, available);
    // Discard excess whole steps after a stall; retain only the fractional remainder.
    this.remaining = Math.max(0, this.remaining - available * this.step);
    for (let i = 0; i < count; i++) {
      if (run(this.step, i === count - 1 ? count * this.step : 0) === false) {
        this.reset(); break;
      }
    }
  }
}
