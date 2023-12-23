import { PARTICLE_STYLES } from "../../consts"
import { ParticleType } from "./_ParticleType"

export class SparkleParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0.1,
      speedSpread: 0,
      forceSpread: 0,
      force: 0,
      life: 0.5,
      lifeDecay: 0,
      scaleSpread: 1,
      acceleration: 0,
      color: { r: 1, g: 1, b: 1 },
      style: PARTICLE_STYLES.point,
      scale: 1.2,
      speedDecay: 0.2,
      positionSpread: { x: 0.01, y: 0.001, z: 0.01 },
      ..._overides,
    })
  }
}
