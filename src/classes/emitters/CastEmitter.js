import { randomFromArray } from "../../utils"
import { SmokeParticle } from "../particles/Smoke"
import { SparkleParticle } from "../particles/Sparkle"
import { Emitter } from "./_Emitter"
export class CastEmitter extends Emitter {
  constructor(sim) {
    const settings = {
      emitRate: 0,
      particleOrder: ["sparkle", "sparkle", "sparkle", "sparkle", "smoke"],
    }

    const particles = {
      smoke: new SmokeParticle(),
      sparkle: new SparkleParticle(),
    }

    super(sim, settings, particles)
  }

  move(position) {
    this.position = position

    const emitCount = 10
    for (let i = 0; i < emitCount; i++) {
      this.emit(this.particles[randomFromArray(this.settings.particleOrder)], "magic", true)
    }

    this.previousPosition = { ...this.position }
  }

  reset() {
    this.previousPosition = null
  }
}
