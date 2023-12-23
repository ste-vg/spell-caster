import { AudioLoader, Group, LoadingManager, TextureLoader } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"

// Model imports

import room_model_file from "url:../../public/models/room.glb"
import demon_model_file from "url:../../public/models/demon.glb"
import crystal_model_file from "url:../../public/models/crystal.glb"

// Sound imports

import sounds_music_file from "url:../../public/sounds/music.mp3"
import sounds_kill_1_file from "url:../../public/sounds/kill-1.mp3"
import sounds_kill_2_file from "url:../../public/sounds/kill-2.mp3"
import sounds_kill_3_file from "url:../../public/sounds/kill-3.mp3"
import sounds_enter_1_file from "url:../../public/sounds/enter-1.mp3"
import sounds_enter_2_file from "url:../../public/sounds/enter-2.mp3"
import sounds_error_1_file from "url:../../public/sounds/error-1.mp3"
import sounds_cast_1_file from "url:../../public/sounds/cast-1.mp3"
import sounds_cast_2_file from "url:../../public/sounds/cast-2.mp3"
import sounds_ping_1_file from "url:../../public/sounds/ping-1.mp3"
import sounds_ping_2_file from "url:../../public/sounds/ping-2.mp3"
import sounds_laugh_1_file from "url:../../public/sounds/laugh-1.mp3"
import sounds_laugh_2_file from "url:../../public/sounds/laugh-2.mp3"
import sounds_laugh_3_file from "url:../../public/sounds/laugh-3.mp3"
import sounds_spell_travel_1_file from "url:../../public/sounds/spell-travel-1.mp3"
import sounds_spell_travel_2_file from "url:../../public/sounds/spell-travel-2.mp3"
import sounds_spell_travel_3_file from "url:../../public/sounds/spell-travel-3.mp3"
import sounds_spell_failed_1_file from "url:../../public/sounds/spell-failed-1.mp3"
import sounds_spell_failed_2_file from "url:../../public/sounds/spell-failed-2.mp3"
import sounds_trapdoor_close_1_file from "url:../../public/sounds/trapdoor-close-1.mp3"
import sounds_trapdoor_close_2_file from "url:../../public/sounds/trapdoor-close-2.mp3"
import sounds_torch_1_file from "url:../../public/sounds/torch-1.mp3"
import sounds_torch_2_file from "url:../../public/sounds/torch-2.mp3"
import sounds_torch_3_file from "url:../../public/sounds/torch-3.mp3"
import crystal_explode_file from "url:../../public/sounds/crystal-explode.mp3"
import crystal_reform_file from "url:../../public/sounds/crystal-reform.mp3"
import glitch_file from "url:../../public/sounds/glitch.mp3"
import portal_file from "url:../../public/sounds/portal.mp3"
import crumble_file from "url:../../public/sounds/crumble.mp3"
import reform_file from "url:../../public/sounds/reform.mp3"

// Texture imports

import magic_particles_file from "url:../../public/textures/magic-particles.png"
import smoke_particles_file from "url:../../public/textures/smoke-particles.png"
import spell_aracane_file from "url:../../public/textures/spell-arcane.png"
import crystal_matcap_file from "url:../../public/textures/crystal-matcap.png"

const T0_LOAD = {
  models: [
    { id: "room", file: room_model_file, scale: 0.15, position: [0.03, -0.26, -0.55] },
    { id: "demon", file: demon_model_file, scale: 0.1, position: [0, 0, 0] },
    { id: "crystal", file: crystal_model_file, scale: 0.05, position: [0, 0, 0] },
  ],
  sounds: [
    { id: "music", file: sounds_music_file },
    { id: "kill-1", file: sounds_kill_1_file },
    { id: "kill-2", file: sounds_kill_2_file },
    { id: "kill-3", file: sounds_kill_3_file },
    { id: "enter-1", file: sounds_enter_1_file },
    { id: "enter-2", file: sounds_enter_2_file },
    { id: "error-1", file: sounds_error_1_file },
    { id: "cast-1", file: sounds_cast_1_file },
    { id: "cast-2", file: sounds_cast_2_file },
    { id: "ping-1", file: sounds_ping_1_file },
    { id: "ping-2", file: sounds_ping_2_file },
    { id: "laugh-1", file: sounds_laugh_1_file },
    { id: "laugh-2", file: sounds_laugh_2_file },
    { id: "laugh-3", file: sounds_laugh_3_file },
    { id: "spell-travel-1", file: sounds_spell_travel_1_file },
    { id: "spell-travel-2", file: sounds_spell_travel_2_file },
    { id: "spell-travel-3", file: sounds_spell_travel_3_file },
    { id: "spell-failed-1", file: sounds_spell_failed_1_file },
    { id: "spell-failed-2", file: sounds_spell_failed_2_file },
    { id: "trapdoor-close-1", file: sounds_trapdoor_close_1_file },
    { id: "trapdoor-close-2", file: sounds_trapdoor_close_2_file },
    { id: "torch-1", file: sounds_torch_1_file },
    { id: "torch-2", file: sounds_torch_2_file },
    { id: "torch-3", file: sounds_torch_3_file },
    { id: "crystal-explode", file: crystal_explode_file },
    { id: "crystal-reform", file: crystal_reform_file },
    { id: "glitch", file: glitch_file },
    { id: "portal", file: portal_file },
    { id: "crumble", file: crumble_file },
    { id: "reform", file: reform_file },
  ],
  textures: [
    { id: "magic-particles", file: magic_particles_file },
    { id: "smoke-particles", file: smoke_particles_file },
    { id: "spell-arcane", file: spell_aracane_file },
    { id: "crystal-matcap", file: crystal_matcap_file },
  ],
}

class Assets {
  constructor() {
    this.loadSequence = ["loadModels", "loadSounds", "loadTextures"]

    this.assets = {
      models: {},
      sounds: {},
      textures: {},
    }

    this.manager = new LoadingManager()

    this.loaders = {
      models: new GLTFLoader(this.manager),
      sounds: new AudioLoader(this.manager),
      textures: new TextureLoader(this.manager),
    }

    this.completedSteps = {
      download: false,
      audioBuffers: false,
      models: false,
    }

    this.audioBufferCount = 0
    this.modelLoadCount = 0

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
    this.loaders.models.setDRACOLoader(dracoLoader)

    // this.init()
  }

  checkComplete() {
    const complete = Object.keys(this.completedSteps).reduce((previous, current) =>
      !previous ? false : this.completedSteps[current]
    )
    if (complete) this.onLoadSuccess()
  }

  checkBuffers() {
    // console.log("checking buffers", this.audioBufferCount, T0_LOAD.sounds.length)
    if (this.audioBufferCount === T0_LOAD.sounds.length) {
      this.completedSteps.audioBuffers = true
      this.checkComplete()
    }
  }

  checkModels() {
    // console.log("checking buffers", this.audioBufferCount, T0_LOAD.sounds.length)
    if (this.modelLoadCount === T0_LOAD.models.length) {
      this.completedSteps.models = true
      this.checkComplete()
    }
  }

  load(onLoadSuccess, onLoadError) {
    this.onLoadSuccess = onLoadSuccess
    this.onLoadError = (err) => {
      console.error(err)
      onLoadError(err)
    }

    this.manager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading file: ${url} \nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
    }

    this.manager.onLoad = () => {
      console.log("Loading complete!")
      this.completedSteps.download = true
      this.checkComplete()
    }

    // this.manager.on

    this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      document.body.style.setProperty("--loaded", itemsLoaded / itemsTotal)
      // console.log(`Progress. Loading file: ${url} \nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
    }

    this.manager.onError = (url) => {
      console.log("There was an error loading " + url)
      this.onLoadError(`error loading ${url}`)
    }

    this.loadNext()
  }

  loadNext() {
    if (this.loadSequence.length) {
      this[this.loadSequence.shift()]()
    } else {
    }
  }

  loadModels() {
    T0_LOAD.models.forEach((item) => {
      this.loaders.models.load(item.file, (gltf) => {
        if (item.position) gltf.scene.position.set(...item.position)
        if (item.scale) gltf.scene.scale.set(item.scale, item.scale, item.scale)
        this.assets.models[item.id] = gltf

        this.modelLoadCount++
        this.checkModels()
      })
    })

    this.loadNext()
  }

  loadSounds() {
    T0_LOAD.sounds.forEach((item) => {
      this.assets.sounds[item.id] = null
      this.loaders.sounds.load(item.file, (buffer) => {
        this.assets.sounds[item.id] = buffer

        this.audioBufferCount++
        this.checkBuffers()
      })
    })
    this.loadNext()
  }

  loadTextures() {
    T0_LOAD.textures.forEach((item) => {
      this.loaders.textures.load(item.file, (texture) => {
        this.assets.textures[item.id] = texture
      })
    })

    this.loadNext()
  }

  getModel(id, deepClone) {
    console.log("--GET MODEL:", id, this.assets.models[id])
    const group = new Group()
    const scene = this.assets.models[id].scene.clone()

    scene.traverse((item) => {
      if (item.isMesh) {
        item.home = {
          position: item.position.clone(),
          rotation: item.rotation.clone(),
          scale: item.scale.clone(),
        }
        if (deepClone) item.material = item.material.clone()
      }
    })

    group.add(scene)
    return { group, scene, animations: this.assets.models[id].animations }
  }

  getTexture(id) {
    return this.assets.textures[id]
  }

  getSound(id) {
    return this.assets.sounds[id]
  }
}

const ASSETS = new Assets()

export { ASSETS }
