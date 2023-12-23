import { PARTICLE_STYLES } from "../../consts"

export class ControlledEmitter {
  constructor(sim) {
    this.sim = sim
    this.particles = {}
    this.remainingTime = 0
    this.active = false

    this.gsapDefaults = {
      onUpdate: this.update,
      onUpdateProperties: [],
    }
  }

  emit(particle = {}) {
    const newParticle = {
      size: 1,
      color: { r: 1, g: 1, b: 1 },
      position: { z: 0.5, y: 0.35, x: 0.5 },
      life: 0.9,
      style: PARTICLE_STYLES.point,
      ...particle,
      lifeDecay: 0,
      speed: 0,
      speedDecay: 0,
      force: 0,
      forceDecay: 0,
      acceleration: 0,
    }

    const particleIndex = this.sim.createParticle("magic", newParticle)

    this.particles[particleIndex] = {
      index: particleIndex,
      ...newParticle.color,
      ...newParticle.position,
      size: newParticle.size,
      life: newParticle.life,
      lastPosition: null,
      animation: null,
    }

    return this.particles[particleIndex]
  }

  update(particle) {
    const { index, size, life } = particle

    const color = { r: particle.r, g: particle.g, b: particle.b }
    const position = { x: particle.x, y: particle.y, z: particle.z }

    const updates = ["size", "life", "color", "position"]
    const values = { size, life, color, position }

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i]
      this.sim.setParticleProperty("magic", index, update, values[update])
    }
  }

  destory(particle) {
    this.sim.setParticleProperty("magic", particle.index, "life", 0)
    delete this.particles[particle.index]
  }

  release(particle) {
    delete this.particles[particle.index]
  }
}
