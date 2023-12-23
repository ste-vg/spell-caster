import { TorchEmitter } from "./emitters/TorchEmitter"
import { TorchLight } from "./lights/TorchLight"
import { SOUNDS } from "./sounds/SoundController"

export class Torch {
  constructor(sim, position, noise) {
    this.state = "OFF"
    this.elapsedTime = 0
    this._light = new TorchLight(position, sim.size, noise)
    this.emitter = new TorchEmitter(position, sim)
  }

  on() {
    if (this.state !== "ON") {
      SOUNDS.play("torch")
      this.state = "ON"
      this._light.active = true
      this._light.color = "#FA9638"
      this.emitter.green = false
    }
  }

  off() {
    this.state = "OFF"
    this._light.active = false
  }

  green() {
    if (this.state !== "VORTEX") {
      SOUNDS.play("torch")
      this.state = "VORTEX"
      this._light.active = true
      this._light.color = "#00FF00"
      this.emitter.green = true
      this.emitter.flamePuff()
    }
  }

  tick(delta, elapsedTime) {
    if (this._light) this._light.tick(delta, this.elapsedTime)
    if (this.state !== "OFF") {
      this.elapsedTime += delta
      if (this.emitter) this.emitter.tick(delta, this.elapsedTime)
    }
  }

  get light() {
    return this._light.object
  }
}
