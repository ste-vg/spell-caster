import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { Emitter } from "./_Emitter"
import { math } from "../../utils"
import { FlameParticle } from "../particles/Flames"
import { ExplodeParticle } from "../particles/Explode"
import { PARTICLE_STYLES } from "../../consts"
import { SOUNDS } from "../sounds/SoundController"

gsap.registerPlugin(MotionPathPlugin)

export class FireSpellEmitter extends Emitter {
  constructor(sim, light, startPosition, enemy) {
    const settings = {
      emitRate: 0.01,
      animationDelay: 1,
      startingDirection: { x: 0, y: 1, z: 0 },
      startingPosition: startPosition,
      particleOrder: ["flame"],
      lightColor: { r: 0.9, g: 0.8, b: 0.1 },
    }

    const color = { r: 1, g: 0.8, b: 0 }

    const particles = {
      flame: new FlameParticle({
        scale: 2,
      }),
      ember: {
        speed: 0.5,
        color: { r: 1, g: 0.3, b: 0 },
        speedSpread: 0.3,
        forceSpread: 0,
        direction: { x: 1, y: 1, z: 1 },
        lifeDecay: 1.5,
        force: 0,
        type: 1,
        directionSpread: { x: 0.1, y: 0.1, z: 0.1 },
        positionSpread: { x: 0, y: 0, z: 0 },
        acceleration: 0.02,
      },

      explodeSmoke: new ExplodeParticle({ color, speed: 0.1, forceDecay: 1.1 }),
      explodeSpark: new ExplodeParticle({
        speed: 0.4,
        color: { r: 1, g: 1, b: 1 },
        forceDecay: 2,
      }),
      explodeShape: new ExplodeParticle({
        color,
        style: PARTICLE_STYLES.circle,
        scale: 0.5,
      }),
    }

    super(sim, settings, particles, light)

    this.active = false

    this.particleOrder = ["flame"]

    this.lastPosition = { ...this.settings.startingPosition, z: this.settings.startingPosition.z + 0.001 }
    this.lookAt = null
    this.lookAtTarget = null
    this.scale = 0.1

    if (this.model) {
      this.model.group.rotateX(math.degToRad(-160))
      this.model.group.rotateZ(math.degToRad(-40))
      this.model.group.scale.set(0, 0, 0)
    }

    this.onUpdate(true)
    this.enemy = enemy

    const introDuration = 0.5

    SOUNDS.play("spell-travel")

    if (this.model) {
      this.animations.push(
        gsap.to(this.model.group.scale, {
          motionPath: [
            { x: 2, y: 2, z: 2 },
            { x: 1, y: 1, z: 1 },
          ],
          ease: "power1.inOut",
          duration: this.delay + introDuration * 1.2,
        })
      )
      this.animations.push(
        gsap.to(this.model.group.rotation, {
          motionPath: [
            { y: math.degToRad(0), x: math.degToRad(-160), z: math.degToRad(-40) },
            { y: math.degToRad(0), x: math.degToRad(-90), z: math.degToRad(192) },
          ],
          ease: "power1.inOut",
          duration: this.delay + introDuration,
        })
      )
    }

    this.animations.push(
      gsap.to(this.position, {
        duration: 1,
        delay: this.delay + introDuration * 0.25,
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
        ease: "power1.in",
        onStart: () => {
          if (this.enemy) this.enemy.incoming()
          this.settings.emitRate = 0.005
        },
        onComplete: () => this.onComplete(),
        onUpdate: () => this.onUpdate(),
      })
    )
  }

  onComplete = () => {
    if (this.enemy) {
      SOUNDS.play("kill")
      this.enemy.kill()
      const explode = 500
      for (let i = 0; i < explode; i++) {
        const random = Math.random()
        if (random > 0.55) this.emit(this.particles["explodeSmoke"])
        else if (random > 0.1) this.emit(this.particles["explodeSpark"])
        else this.emit(this.particles["explodeShape"])
      }
    }
    this.destory()
  }

  onUpdate = (skipDirection = false) => {
    if (!skipDirection)
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
    }

    this.active = true
    this.lastPosition = { ...this.position }
  }
}
