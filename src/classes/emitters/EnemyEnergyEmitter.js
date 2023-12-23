import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { vector } from "../../utils"
import { ControlledEmitter } from "./_ControlledEmitter"
import { PARTICLE_STYLES } from "../../consts"
import { lerp } from "three/src/math/MathUtils"

gsap.registerPlugin(MotionPathPlugin)

export class EnemyEnergyEmitter extends ControlledEmitter {
  constructor(sim, location) {
    super(sim)

    this.location = location
    this.emitRate = 0.05
  }

  start() {
    this.active = true
  }

  stop() {
    this.active = false
  }

  tick(delta, elapsedTime) {
    if (this.active && this.emitRate > 0) {
      this.remainingTime += delta
      const emitCount = Math.floor(this.remainingTime / this.emitRate)
      this.remainingTime -= emitCount * this.emitRate

      for (let i = 0; i < emitCount; i++) {
        const particle = this.emit({
          life: 1,
          size: 0.3 + Math.random() * 0.1,
          style: Math.random() > 0.5 ? PARTICLE_STYLES.plus : PARTICLE_STYLES.point,
          color: { r: 0.8, g: Math.random(), b: 1 },
        })

        particle.aniamtion = gsap.to(particle, {
          motionPath: [
            { x: 0.5, y: 0.35, z: 0.5 },
            {
              x: lerp(0.5, this.location.x, 0.5) + Math.random() * 0.1,
              y: 0.4 + Math.random() * 0.1,
              z: lerp(0.5, this.location.z, 0.5) + Math.random() * 0.1,
            },
            { x: this.location.x, y: 0.3, z: this.location.z },
          ],
          duration: 1 + Math.random() * 0.5,
          life: 0.1,
          ease: "none",
          onUpdate: () => this.update(particle),
          onComplete: () => this.destory(particle),
        })
      }
    }
  }
}
