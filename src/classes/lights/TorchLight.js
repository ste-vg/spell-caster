import gsap from "gsap"
import { Color, Group, Mesh, MeshBasicMaterial, PointLight, SphereGeometry } from "three"

export class TorchLight {
  constructor(position, offset, noise) {
    const color = new Color("#FA9638")
    this.position = position
    this.offset = offset
    this.group = new Group()
    this.pointLight = new PointLight(color, 0, 0.6)
    this.group.add(this.pointLight)
    this.group.position.set(
      this.position.x * this.offset.x,
      this.position.y * this.offset.y,
      this.position.z * this.offset.z
    )
    this.noise = noise
    this._active = false
    this.baseIntesity = 1

    if (window.DEBUG.lights) {
      const helper = new Mesh(new SphereGeometry(0.02), new MeshBasicMaterial({ color: 0xff0000 }))
      this.group.add(helper)
    }
  }

  get light() {
    return this.group
  }

  get object() {
    return this.group
  }

  set active(value) {
    if (value !== this._active) {
      this._active = value
      if (this._active) {
        gsap.fromTo(this, { baseIntesity: 3 }, { baseIntesity: 1, duration: 0.3 })
      }
    }
  }

  set color(newColor) {
    this.pointLight.color = new Color(newColor)
  }

  tick(delta, elapsedTime) {
    const n = this.noise(this.position.x * 2, this.position.y * 2, elapsedTime * 3) + 1 * 0.5
    this.pointLight.intensity = this._active ? this.baseIntesity + 0.5 * n : 0
  }
}
