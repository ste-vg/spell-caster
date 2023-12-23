import { DustParticle } from "../particles/Dust"
import { Emitter } from "./_Emitter"

export class DustEmitter extends Emitter {
  constructor(sim, assets) {
    const settings = {
      emitRate: 0.03,
      particleOrder: ["dust"],
    }

    const particles = {
      dust: new DustParticle(),
    }

    super(sim, settings, particles)

    const startCount = 5
    for (let i = 0; i < startCount; i++) {
      this.emit(this.particles["dust"], "smoke")
    }
  }
}
