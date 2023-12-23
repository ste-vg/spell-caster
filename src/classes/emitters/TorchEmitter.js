import gsap from "gsap"
import { FlameParticle } from "../particles/Flames"
import { ForceParticle } from "../particles/Force"
import { SmokeParticle } from "../particles/Smoke"
import { Emitter } from "./_Emitter"

export class TorchEmitter extends Emitter {
  constructor(position, sim) {
    const settings = {
      emitRate: 0.03,
      particleOrder: ["force", "flame", "redFlame", "smoke", "flame", "redFlame", "smoke", "flame", "flame"],
      startingPosition: position,
      startingDirection: { x: 0, y: 1, z: 0 },
    }

    const particles = {
      flame: new FlameParticle({
        positionSpread: { x: 0, y: 0, z: 0 },
        directionSpread: { x: 0.4, y: 0, z: 0.4 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0.1,
        speed: 0.25,
        speedDecay: 0.99,
        lifeDecay: 1.7,
        acceleration: 0.2,
        scale: 2.5,
        scaleSpread: 0.3,
      }),
      redFlame: new FlameParticle({
        color: { r: 1, g: 0.3, b: 0 },
        positionSpread: { x: 0, y: 0, z: 0 },
        directionSpread: { x: 0.4, y: 0, z: 0.4 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0.1,
        speed: 0.3,
        speedDecay: 0.99,
        lifeDecay: 1,
        acceleration: 0.2,
        scale: 2.5,
        scaleSpread: 0.3,
      }),
      smoke: new SmokeParticle({
        positionSpread: { x: 0, y: 0, z: 0 },
        directionSpread: { x: 0.4, y: 0, z: 0.4 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0.1,
        speed: 0.3,
        speedDecay: 0.6,
        lifeDecay: 0.7,
        acceleration: 0.2,
        color: { r: 0.1, g: 0.1, b: 0.1 },
        scale: 4,
        scaleSpread: 0.3,
      }),

      force: new ForceParticle(),
    }

    super(sim, settings, particles)
  }

  flamePuff() {
    gsap.fromTo(this.particles.flame, { scale: 5 }, { scale: 2.5, duration: 1 })
  }

  set green(value) {
    if (value) {
      this.particles.flame.color = { r: 0, g: 1, b: 0 }
      this.particles.redFlame.color = { r: 0.5, g: 1, b: 0.2 }
    } else {
      this.particles.flame.color = { r: 1, g: 1.0, b: 0.3 }
      this.particles.redFlame.color = { r: 1, g: 0.3, b: 0 }
    }
  }
}
