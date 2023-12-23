import { gsap } from "gsap"
import { AnimationMixer } from "three"
import { vector } from "../../utils"

const DEFAULT_EMITTER_SETTINGS = {
  startingPosition: { x: 0.5, y: 0.5, z: 0.5 },
  startingDirection: { x: 0, y: 0, z: 0 },
  emitRate: 0.001,
  particleOrder: [],
  model: null,
  animationDelay: 0,
  lightColor: { r: 1, g: 1, b: 1 },
  group: "magic",
}

export class Emitter {
  constructor(sim, emitterSettings, particleTypes, light) {
    this.sim = sim
    this.light = light
    this.active = true
    this.animations = []
    this.settings = { ...DEFAULT_EMITTER_SETTINGS, ...emitterSettings }
    this.delay = this.settings.animationDelay

    if (this.light) {
      gsap.killTweensOf(this.light)
      this.light.color.setRGB(this.settings.lightColor.r, this.settings.lightColor.g, this.settings.lightColor.b)
      this.light.intensity = 3
    }

    this.particles = { ...particleTypes }

    this.position = { ...this.settings.startingPosition }
    this.direction = { ...this.settings.startingDirection }
    this.remainingTime = 0
    this.destroyed = false
    this.modelScale = 1

    this.count = 0

    this.moveFunction()

    if (this.settings.model) {
      this.model = this.settings.model
      if (this.model.animations && this.model.animations.length) {
        this.mixer = new AnimationMixer(this.model.scene)
        this.mixer.timeScale = 1.3
        this.mixer.clipAction(this.model.animations[0]).play()
      }
    }
  }

  moveFunction = (delta, elapsedTime) => {
    if (this.light)
      this.light.position.set(
        this.position.x * this.sim.size.x,
        this.position.y * this.sim.size.y,
        this.position.z * this.sim.size.z
      )
  }

  pause() {
    this.animations.map((animation) => animation.pause())
  }

  resume() {
    this.animations.map((animation) => animation.resume())
  }

  destory() {
    if (this.model) {
      this.model.group.parent.remove(this.model.group)
      this.model = null
    }

    if (this.light) {
      this.animations.push(gsap.fromTo(this.light, { intensity: 15 }, { intensity: 0, ease: "power1.in", duration: 1 }))
    }

    this.destroyed = true
  }

  emit(particle, group, casted = false) {
    if (!group) group = this.settings.group

    const positionAlongLine = this.previousPosition
      ? vector.lerpVectors(this.previousPosition, this.position, Math.random())
      : this.position

    const position = {
      x: positionAlongLine.x + (Math.random() * 2 - 1) * particle.positionSpread.x,
      y: positionAlongLine.y + (Math.random() * 2 - 1) * particle.positionSpread.y,
      z: positionAlongLine.z + (Math.random() * 2 - 1) * particle.positionSpread.z,
    }

    let direction = {}

    if (!particle.direction) {
      direction = {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
      }
    } else {
      direction = {
        x: this.direction.x * particle.direction.x + (Math.random() * 2 - 1) * particle.directionSpread.x,
        y: this.direction.y * particle.direction.y + (Math.random() * 2 - 1) * particle.directionSpread.y,
        z: this.direction.z * particle.direction.z + (Math.random() * 2 - 1) * particle.directionSpread.z,
      }
    }

    const speed = particle.speed + Math.random() * particle.speedSpread
    const force = particle.force + Math.random() * particle.forceSpread
    const scale = particle.scale * (particle.scaleSpread > 0 ? Math.random() * particle.scaleSpread : 1)

    this.sim.createParticle(group, {
      ...particle.settings,
      position,
      direction,
      speed,
      force,
      scale,
      casted,
    })
  }

  tick(delta, elapsedTime) {
    if (this.active && this.settings.emitRate > 0) {
      this.remainingTime += delta
      if (this.mixer) this.mixer.update(delta * this.mixer.timeScale)
      if (this.moveFunction) this.moveFunction(delta, elapsedTime)

      const emitCount = Math.floor(this.remainingTime / this.settings.emitRate)
      this.remainingTime -= emitCount * this.settings.emitRate

      for (let i = 0; i < emitCount; i++) {
        this.emit(this.particles[this.settings.particleOrder[this.count % this.settings.particleOrder.length]])
        this.count++
      }
    }

    this.previousPosition = { ...this.position }
  }
}
