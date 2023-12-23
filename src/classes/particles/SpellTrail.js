import { PARTICLE_STYLES } from "../../consts"
import { ParticleType } from "./_ParticleType"

export class SpellTrailParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}

    super({
      speed: 0.5,
      speedDecay: 0.4,
      color: { r: 1, g: 1, b: 1 },
      speedSpread: 0.1,
      forceSpread: 0.2,
      force: 0.8,
      forceDecay: 0.8,
      scale: 1,
      scaleSpread: 1,
      lifeDecay: 1.5,
      direction: { x: 1, y: 1, z: 1 },
      directionSpread: { x: 0.1, y: 0.1, z: 0.1 },
      positionSpread: { x: 0, y: 0, z: 0 },
      acceleration: 0.02,
      style: PARTICLE_STYLES.smoke,
      ..._overides,
    })
  }
}
