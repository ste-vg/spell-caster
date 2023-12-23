import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { Emitter } from "./_Emitter"
import { SpellTrailParticle } from "../particles/SpellTrail"
import { PARTICLE_STYLES } from "../../consts"
import { ExplodeParticle } from "../particles/Explode"
import { lerp } from "three/src/math/MathUtils"
import { SOUNDS } from "../sounds/SoundController"

gsap.registerPlugin(MotionPathPlugin)

export class VortexSpellEmitter extends Emitter {
  constructor(sim, light, startPosition) {
    const color = { r: 0, g: 1, b: 0 }

    const settings = {
      emitRate: 0.0001,
      animationDelay: 1,

      startingPosition: startPosition,
      lightColor: color,
      particleOrder: ["smoke", "smoke", "smoke", "smoke", "smoke", "circle", "circle"],
    }

    const particles = {
      smoke: new SpellTrailParticle({
        color,
      }),
      sparkle: new SpellTrailParticle({
        style: PARTICLE_STYLES.point,
        scale: 0.1,
      }),
      circle: new SpellTrailParticle({
        color,
        style: PARTICLE_STYLES.disc,
      }),
      explodeSmoke: new ExplodeParticle({
        color,
        direction: { x: 0, y: 1, z: 0 },
        directionSpread: { x: 0.05, y: 0.05, z: 0.05 },
      }),
      explodeSpark: new ExplodeParticle({
        speed: 0.1,
        direction: { x: 0, y: 1, z: 0 },
        directionSpread: { x: 0.05, y: 0.05, z: 0.05 },
        color: { r: 1, g: 1, b: 1 },
        speedDecay: 0.99,
        lifeDecay: 0.9,
        style: PARTICLE_STYLES.point,
        acceleration: 0.01,
      }),
      explodeShape: new ExplodeParticle({
        color,
        direction: { x: 0, y: 1, z: 0 },
        directionSpread: { x: 0.05, y: 0.05, z: 0.05 },
        style: PARTICLE_STYLES.disc,
        speedDecay: 0.99,
        scale: 0.9,
        speed: 0.1,
        lifeDecay: 0.8,
        acceleration: 0.01,
      }),
    }

    super(sim, settings, particles, light)

    this.active = false

    this.particleOrder = ["smoke"]

    this.lookAt = { x: 0, y: 0, z: 0 }
    this.lookAtTarget = null
    this.scale = 0.1

    SOUNDS.play("spell-travel")

    this.animations.push(
      gsap.to(this.position, {
        duration: 0.6,
        delay: this.delay,

        motionPath: {
          curviness: 0.5,
          path: [
            { x: 0.5, y: 1, z: 0.5 },
            { x: 0.5, y: 0.1, z: 0.5 },
          ],
        },
        ease: "linear",
        onComplete: () => this.onComplete(),
        onUpdate: () => this.onUpdate(),
      })
    )
  }

  onComplete = () => {
    const explode = 1000
    for (let i = 0; i < explode; i++) {
      const random = Math.random()
      if (random > 0.55) this.emit(this.particles["explodeSmoke"])
      else if (random > 0.1) this.emit(this.particles["explodeSpark"])
      else this.emit(this.particles["explodeShape"])
    }

    this.destory()
  }

  onUpdate = () => {
    this.active = true
    this.lastPosition = { ...this.position }
  }
}
