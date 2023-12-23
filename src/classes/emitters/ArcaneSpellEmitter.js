import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { Emitter } from "./_Emitter"
import { UTILS } from "../../utils"
import { SmokeParticle } from "../particles/Smoke"
import { SparkleParticle } from "../particles/Sparkle"
import { SpellSmokeParticle, SpellTrailParticle } from "../particles/SpellTrail"
import { PARTICLE_STYLES } from "../../consts"
import { ExplodeParticle } from "../particles/Explode"
import { lerp } from "three/src/math/MathUtils"
import { SOUNDS } from "../sounds/SoundController"
import { ASSETS } from "../Assets"

gsap.registerPlugin(MotionPathPlugin)

export class ArcaneSpellEmitter extends Emitter {
  constructor(sim, light, startPosition, enemy) {
    const color = { r: 0.2, g: 0, b: 1 }

    const settings = {
      emitRate: 0.001,
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
      explodeSmoke: new ExplodeParticle({ color }),
      explodeSpark: new ExplodeParticle({
        speed: 0.4,
        color: { r: 1, g: 1, b: 1 },
        forceDecay: 2,
        style: PARTICLE_STYLES.point,
      }),
      explodeShape: new ExplodeParticle({
        color,
        style: PARTICLE_STYLES.disc,
        scale: 0.5,
      }),
    }

    super(sim, settings, particles, light)

    this.active = false
    this.enemy = enemy
    this.particleOrder = ["smoke"]
    this.lookAt = { x: 0, y: 0, z: 0 }
    this.lookAtTarget = null
    this.scale = 0.1

    SOUNDS.play("spell-travel")
    this.animations.push(
      gsap.to(
        this.position,

        {
          duration: 0.9,
          delay: this.delay,
          motionPath: {
            curviness: 1.5,
            path: [
              this.position,
              { x: 0.5, y: Math.random(), z: 0.8 },
              { x: 0.1 + Math.random() * 0.8, y: 0.2 + Math.random() * 0.4, z: 0.4 },
              this.enemy
                ? { x: this.enemy.location.x, y: 0.4, z: this.enemy.location.z }
                : { x: 0.1 + Math.random() * 0.8, y: 1, z: 0.2 },
            ],
          },
          ease: "linear",
          onStart: () => {
            if (this.enemy) this.enemy.incoming()
          },
          onComplete: () => this.onComplete(),
          onUpdate: () => this.onUpdate(),
        }
      )
    )
  }

  onComplete = () => {
    if (this.enemy) {
      this.enemy.kill()
      SOUNDS.play("kill")
      const explode = 200
      for (let i = 0; i < explode; i++) {
        const random = Math.random()
        if (random > 0.55) this.emit(this.particles["explodeSmoke"])
        else if (random > 0.1) this.emit(this.particles["explodeSpark"])
        else this.emit(this.particles["explodeShape"])
      }
    }
    this.destory()
  }

  onUpdate = () => {
    if (this.lastPosition) {
      this.direction = {
        x: this.position.x - this.lastPosition.x,
        y: this.position.y - this.lastPosition.y,
        z: this.position.z - this.lastPosition.z,
      }

      if (this.model) {
        this.model.group.position.set(
          this.position.x * this.sim.size.x,
          this.position.y * this.sim.size.y,
          this.position.z * this.sim.size.z
        )

        this.lookAtTarget = {
          x: this.sim.startCoords.x + (this.position.x + this.direction.x) * this.sim.size.x,
          y: this.sim.startCoords.y + (this.position.y + this.direction.y) * this.sim.size.y,
          z: this.sim.startCoords.z + (this.position.z + this.direction.z) * this.sim.size.z,
        }

        const lerpAmount = 0.08

        this.lookAt.x = lerp(this.lookAt.x, this.lookAtTarget.x, lerpAmount)
        this.lookAt.y = lerp(this.lookAt.y, this.lookAtTarget.y, lerpAmount)
        this.lookAt.z = lerp(this.lookAt.z, this.lookAtTarget.z, lerpAmount)

        this.model.group.lookAt(this.lookAt.x, this.lookAt.y, this.lookAt.z)
      }
    }
    this.active = true
    this.lastPosition = { ...this.position }
  }
}
