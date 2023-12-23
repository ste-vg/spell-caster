import { gsap } from "gsap"
import { ControlledEmitter } from "./_ControlledEmitter"

export class CrystalEnergyEmitter extends ControlledEmitter {
  constructor(sim) {
    super(sim)

    this.emitRate = 0.2
    this._active = false
  }

  tick(delta, elapsedTime) {
    if (this.active && this.emitRate > 0) {
      this.remainingTime += delta
      const emitCount = Math.floor(this.remainingTime / this.emitRate)
      this.remainingTime -= emitCount * this.emitRate

      for (let i = 0; i < emitCount; i++) {
        const particle = this.emit({
          life: 1,
          size: 0.4,
          color: { r: 0.8, g: Math.random(), b: 1 },
          position: {
            x: 0.5 + (Math.random() * 0.05 - 0.025),
            y: 0.5 + (Math.random() * 0.05 - 0.025),
            z: 0.5 + (Math.random() * 0.05 - 0.025),
          },
        })

        particle.animation = gsap.to(particle, {
          y: 0.35,
          x: 0.5,
          z: 0.5,
          duration: 2,
          life: 0.5,
          ease: "power4.in",
          onUpdate: () => this.update(particle),
          onComplete: () => this.destory(particle),
        })
      }
    }
  }

  set active(value) {
    this.remainingTime = 0
    this._active = value
  }

  get active() {
    return this._active
  }
}
