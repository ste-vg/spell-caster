import { ForceParticle } from "../particles/Force"
import { SmokeParticle } from "../particles/Smoke"
import { SparkleParticle } from "../particles/Sparkle"
import { Emitter } from "./_Emitter"

export class GhostEmitter extends Emitter {
  constructor(sim) {
    const settings = {
      emitRate: 0,
      particleOrder: ["trailSmoke"],
      startingDirection: { x: 0, y: -1, z: 0 },
      group: "smoke",
    }

    const particles = {
      trailSmoke: new SmokeParticle({
        positionSpread: { x: 0.03, y: 0.03, z: 0.03 },
        directionSpread: { x: 0.3, y: 0, z: 0.3 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0.2,
        speed: 0.3,
        speedDecay: 0.2,
        lifeDecay: 0.8,
        acceleration: 0.1,
        scale: 0.4,
      }),
      smoke: new SmokeParticle({
        color: { r: 0, g: 0, b: 0 },
        positionSpread: { x: 0.05, y: 0, z: 0.05 },
        directionSpread: { x: 0.3, y: 0, z: 0.3 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0,
        speed: 0.3,
        speedDecay: 0.2,
        lifeDecay: 0.4,
        acceleration: 0.1,
        scale: 1,
      }),
      force: new ForceParticle({
        directionSpread: { x: 0.4, y: 0, z: 0.4 },
      }),
      smokeUp: new SmokeParticle({
        color: { r: 0, g: 0, b: 0 },
        positionSpread: { x: 0.1, y: 0.3, z: 0.1 },
        directionSpread: { x: 0.3, y: 0, z: 0.3 },
        direction: { x: -1, y: -1, z: -1 },
        force: 0.2,
        speed: 0.6,
        speedDecay: 0.2,
        lifeDecay: 0.6,
        acceleration: 0,
        scale: 1,
      }),
      sparkle: new SparkleParticle({
        speed: 0.6,
        life: 1.0,
        lifeDecay: 0.7,
        positionSpread: { x: 0.1, y: 0.1, z: 0.1 },
        directionSpread: { x: 1, y: 1, z: 1 },
      }),
    }

    super(sim, settings, particles)
  }

  puffOfSmoke(sparkles = false) {
    const smokePuff = 50
    for (let i = 0; i < smokePuff; i++) {
      this.emit(this.particles["smokeUp"], "smoke")
    }
    if (sparkles) {
      const sparks = 100
      for (let i = 0; i < sparks; i++) {
        this.emit(this.particles["sparkle"], "magic")
      }
    }
  }

  animatingIn() {
    this.settings.emitRate = 0.0015
  }

  idle() {
    this.settings.particleOrder = ["force", "smoke", "smoke", "smoke", "smoke", "smoke", "smoke"]
    this.settings.emitRate = 0.03
  }
}
