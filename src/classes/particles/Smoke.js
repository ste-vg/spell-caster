import { PARTICLE_STYLES } from "../../consts"
import { ParticleType } from "./_ParticleType"

export class SmokeParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0,
      speedDecay: 0,
      speedSpread: 0,
      forceSpread: 0,
      force: 0,
      life: 1,
      lifeDecay: 0,
      scaleSpread: 1,
      acceleration: 0,
      positionSpread: { x: 0.02, y: 0, z: 0.001 },
      color: { r: 0.75, g: 0.75, b: 0.75 },
      style: PARTICLE_STYLES.smoke,
      scale: 1,
      ..._overides,
    })
  }
}
