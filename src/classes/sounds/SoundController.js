import { Audio, AudioListener } from "three"
import { randomFromArray } from "../../utils"
import { ASSETS } from "../Assets"

class SoundController {
  constructor() {
    this.audioListener = new AudioListener()

    this.ready = false

    this.sounds = [
      { id: "music", loop: true, volume: 0.5 },
      { id: "kill", files: ["kill-1", "kill-2", "kill-3"] },
      { id: "enter", files: ["enter-1", "enter-2"] },
      { id: "cast", files: ["cast-1", "cast-2"] },
      { id: "ping", files: ["ping-1", "ping-2"] },
      { id: "laugh", files: ["laugh-1", "laugh-2", "laugh-3"] },
      { id: "error", files: ["error-1"] },
      { id: "spell-travel", files: ["spell-travel-1", "spell-travel-2", "spell-travel-3"] },
      { id: "spell-failed", volume: 0.5, files: ["spell-failed-1", "spell-failed-2"] },
      { id: "trapdoor-close", files: ["trapdoor-close-1", "trapdoor-close-2"] },
      { id: "torch", files: ["torch-1", "torch-2", "torch-3"] },
      { id: "crystal-explode", files: ["crystal-explode"] },
      { id: "crystal-reform", files: ["crystal-reform"] },
      { id: "glitch", volume: 0.8, files: ["glitch"] },
      { id: "portal", files: ["portal"] },
      { id: "crumble", files: ["crumble"] },
      { id: "reform", files: ["reform"] },
    ]
    this.soundMap = {}

    this.state = {
      sounds: true,
    }

    this.buttons = {
      sounds: document.querySelector("#sounds-button"),
      soundsText: document.querySelector("#sounds-button .sr-only"),
    }

    for (let i = this.sounds.length - 1; i >= 0; i--) {
      const sound = this.sounds[i]
      if (sound.files) {
        sound.files.forEach((id) => {
          this.sounds.push({
            id,
            loop: sound.loop ? sound.loop : false,
            volume: sound.volume ? sound.volume : 1,
          })
        })
      }
    }
  }

  init(stage) {
    if (window.DEBUG.disableSounds) {
      this.state = { sounds: false }
    }

    stage.camera.add(this.audioListener)

    this.sounds.forEach((d) => {
      if (d.files) {
        this.soundMap[d.id] = {
          selection: d.files,
        }
      } else {
        let buffer = ASSETS.getSound(d.id)

        const sound = new Audio(this.audioListener)
        stage.add(sound)

        sound.setBuffer(buffer)
        sound.setLoop(d.loop ? d.loop : false)
        sound.setVolume(d.volume ? d.volume : 1)

        this.soundMap[d.id] = sound
        d.sound = sound
      }

      this.ready = true
    })

    const types = ["sounds"]
    types.forEach((type) => {
      this.buttons[type].addEventListener("click", () => this.toggleState(type))
      this.updateButton(type)
    })
  }

  initError() {
    return console.error("sounds not initialized")
  }

  toggleState(type) {
    if (!this.ready) return this.initError()
    console.log("toggling", type)
    this.state[type] = !this.state[type]
    this.updateButton(type)

    if (this.state.sounds) {
      this.startMusic()
    } else {
      this.stopAll()
      this.stopMusic()
    }
  }

  updateButton(type) {
    if (this.state[type]) delete this.buttons.sounds.dataset.off
    else this.buttons.sounds.dataset.off = "true"

    const copy = this.buttons.soundsText.dataset.copy
    this.buttons.soundsText.innerText = copy.replace("$$state", this.state[type] ? "off" : "on")
  }

  setSoundsState(state) {
    if (!this.ready) return this.initError()
    this.state.sounds = state
    if (this.state.sounds) {
      this.startMusic()
    } else {
      this.stopAll()
      this.stopMusic()
    }

    this.updateButton("sounds")
  }

  startMusic() {
    if (!this.ready) return this.initError()

    if (this.state.sounds) {
      this.soundMap.music.play()
    } else {
      this.stopMusic()
    }
  }

  stopMusic() {
    if (!this.ready) return this.initError()
    this.soundMap.music.pause()
    this.soundMap.music.isPlaying = false
  }

  play(id, restart = true) {
    if (!this.ready) return this.initError()
    if (this.state.sounds) {
      const sound = this.soundMap[id]?.selection
        ? this.soundMap[randomFromArray(this.soundMap[id].selection)]
        : this.soundMap[id]

      if (sound) {
        sound.play()
        sound.isPlaying = false
      }
    }
  }

  stopAll() {
    if (!this.ready) return this.initError()

    this.sounds.forEach((d) => {
      if (d.id !== "music" && d.sound) d.sound.pause()
    })
  }
}

export const SOUNDS = new SoundController()
