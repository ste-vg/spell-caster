import { DustParticle } from "../particles/Dust"
import { Emitter } from "./_Emitter"

export class SnowEmitter extends Emitter {
  constructor(sim, assets) {
    const settings = {
      emitRate: 0.05,
      particleOrder: ["dust"],
    }

    const particles = {
      dust: new DustParticle({
        speedDecay: 0,
        speed: 0.1,
        color: { r: 1, g: 1, b: 1 },
        position: { x: 0.5, y: 0, z: 0.5 },
        positionSpread: { x: 0.5, y: 0, z: 0.5 },
        direction: { x: 0, y: 1, z: 0 },
        directionSpread: { x: 0.1, y: 0, z: 0.1 },
        acceleration: 0,
      }),
    }

    super(sim, settings, particles)

    const startCount = 10
    for (let i = 0; i < startCount; i++) {
      this.emit(this.particles["dust"], "smoke")
    }
  }
}
