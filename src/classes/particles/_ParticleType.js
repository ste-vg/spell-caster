import { PARTICLE_STYLES } from "../../consts"

const DEFAULT_PARTICLE_SETTINGS = {
  speed: 0.2,
  speedDecay: 0.6,
  speedSpread: 0,
  force: 0.2,
  forceDecay: 0.1,
  forceSpread: 0,
  life: 1,
  lifeDecay: 0.6,
  directionSpread: { x: 0.001, y: 0.001, z: 0.001 },
  positionSpread: { x: 0.01, y: 0.01, z: 0.01 },
  color: { r: 1, g: 1, b: 1 },
  scale: 1,
  scaleSpread: 0,
  style: PARTICLE_STYLES.soft,
  acceleration: 0.1,
}

export class ParticleType {
  constructor(settings) {
    this.settings = { ...DEFAULT_PARTICLE_SETTINGS, ...settings }
  }

  get speed() {
    return this.settings.speed
  }

  get speedDecay() {
    return this.settings.speedDecay
  }

  get speedSpread() {
    return this.settings.speedSpread
  }

  get force() {
    return this.settings.force
  }

  get forceDecay() {
    return this.settings.forceDecay
  }

  get forceSpread() {
    return this.settings.forceSpread
  }

  get life() {
    return this.settings.life
  }

  get lifeDecay() {
    return this.settings.lifeDecay
  }

  get directionSpread() {
    return this.settings.directionSpread
  }

  get direction() {
    return this.settings.direction
  }

  get position() {
    return this.settings.position
  }

  get positionSpread() {
    return this.settings.positionSpread
  }

  get color() {
    return this.settings.color
  }

  set color(value) {
    this.settings.color = value
  }

  get scale() {
    return this.settings.scale
  }

  set scale(value) {
    this.settings.scale = value
  }

  get scaleSpread() {
    return this.settings.scaleSpread
  }

  get style() {
    return this.settings.style
  }

  get acceleration() {
    return this.settings.acceleration
  }
}
