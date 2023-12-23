import { PARTICLE_STYLES } from "../../consts"
import { DustParticle } from "../particles/Dust"
import { Emitter } from "./_Emitter"

export class WinEmitter extends Emitter {
  constructor(sim, assets) {
    const settings = {
      emitRate: 0.001,
      particleOrder: ["dustRed", "dustGreen", "dustBlue"],
    }

    const particles = {
      dustRed: new DustParticle({ color: { r: 1, g: 1, b: 0 }, style: PARTICLE_STYLES.point, scale: 0.5 }),
      dustGreen: new DustParticle({ color: { r: 0, g: 1, b: 1 }, style: PARTICLE_STYLES.point, scale: 0.5 }),
      dustBlue: new DustParticle({ color: { r: 1, g: 0, b: 1 }, style: PARTICLE_STYLES.point, scale: 0.5 }),
    }

    super(sim, settings, particles)
  }
}
