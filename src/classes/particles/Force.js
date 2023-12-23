import { PARTICLE_STYLES } from "../../consts"
import { ParticleType } from "./_ParticleType"

export class ForceParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0.4,
      speedDecay: 0.4,
      color: { r: 1, g: 0, b: 0 },
      force: 1,
      forceDecay: 0,
      direction: { x: 1, y: 1, z: 1 },
      directionSpread: { x: 0.3, y: 0, z: 0.3 },
      acceleration: 0,
      scale: 0.3,
      style: window.DEBUG.forceParticles ? PARTICLE_STYLES.circle : PARTICLE_STYLES.invisible,
      ..._overides,
    })
  }
}
