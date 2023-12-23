import { PARTICLE_STYLES } from "../../consts"
import { ParticleType } from "./_ParticleType"

export class DustParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0,
      speedDecay: 0.4,
      color: { r: 0.5, g: 0.5, b: 0.5 },
      speedSpread: 0,
      forceSpread: 0,
      force: 0,
      style: PARTICLE_STYLES.circle,
      life: 1,
      lifeDecay: 0.3,
      scale: 0.06,
      acceleration: 1,
      positionSpread: { x: 0.5, y: 0.5, z: 0.5 },
      ..._overides,
    })
  }
}
