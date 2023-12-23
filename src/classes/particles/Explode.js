import { PARTICLE_STYLES } from "../../consts"
import { ParticleType } from "./_ParticleType"

export class ExplodeParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0.4,
      speedSpread: 0,
      speedDecay: 0.8,
      forceSpread: 0,
      force: 2,
      forceDecay: 0.9,
      type: PARTICLE_STYLES.smoke,
      ..._overides,
    })
  }
}
