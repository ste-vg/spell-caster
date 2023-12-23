import { Clock, Group, PointLight } from "three"
import { ParticleSim } from "./ParticleSim"
import { SimViz } from "./SimViz"
import { Stage } from "./Stage"
import { interpret } from "xstate"
import { AppMachine } from "../machines/app-machine"
import { ASSETS } from "./Assets"
import { ArcaneSpellEmitter } from "./emitters/ArcaneSpellEmitter"
import { FireSpellEmitter } from "./emitters/FireSpellEmitter"
import { DustEmitter } from "./emitters/DustEmitter"
import { Room } from "./Room"
import { SpellCaster } from "./SpellCaster"
import { Enemy } from "./enemies/_Enemy"
import { Location } from "./Location"
import { createNoise3D } from "simplex-noise"
import { gsap } from "gsap"
import { Entrance } from "./Entrance"
import { SOUNDS } from "./sounds/SoundController"
import { EnemyPreloader } from "./enemies/EnemyPreloader"
import Stats from "three/examples/jsm/libs/stats.module.js"
import { EnemyEnergyEmitter } from "./emitters/EnemyEnergyEmitter"
import { Crystal } from "./Crystal"
import { Torch } from "./Torch"
import { Screens } from "./Screens"
import { VortexSpellEmitter } from "./emitters/VortexSpellEmitter"
import { WinEmitter } from "./emitters/WinEmitter"

const DOM = {
  body: document.body,
  app: document.querySelector(".app"),
  state: document.querySelector(".state"),
  controls: document.querySelector(".controls"),
  canvas: document.querySelector(".canvas"),
  svg: document.querySelector("#spell-helper"),
  demonCount: document.querySelector("[data-demon-count]"),
  spellGuide: document.querySelector("#spell-guide"),
  chargingNotification: document.querySelector(".charging-notification"),
}

const ENEMY_SETTINGS = {
  lastSent: 0,
  sendFrequency: 5,
  sendFrequencyReduceBy: 0.2,
  minSendFrequency: 2,
  totalSend: 42,
  sendCount: 0,
  killCount: 0,
}

export class App {
  constructor() {
    this.stage = new Stage(DOM.canvas)
    this.machine = interpret(AppMachine)
    this.animations = []
    this.frame = 0
    this.elapsedGameTime = 0
    this.health = 1
    this.healthDecay = 0.01
    this.healthReplenish = 0.015
    this.rotating = false
    this.noise = createNoise3D()
    this.rotationSpeed = 0.2
    this.gameSpeed = 1
    this.endlessMode = false

    if (window.DEBUG.endlessMode) {
      document.querySelector("#endless-mode").style.display = "block"
    }

    if (window.DEBUG.appState) {
      document.querySelector("#app-state").style.display = "block"
      DOM.app.classList.add("showState")
    }

    if (window.DEBUG.layoutDebug) {
      DOM.body.classList.add("debug-layout")
    }

    this.screens = new Screens(DOM.app, this.machine)

    this.enemyState = { ...ENEMY_SETTINGS }

    this.appState = this.machine.initialState.value

    this.emitters = []
    this.enemies = []
    this.torches = []

    this.init()
  }

  init() {
    this.clock = new Clock()
    this.clockWasPaused = false

    this.machine.onTransition((s) => this.onStateChange(s))
    this.machine.start()

    document.body.addEventListener("keyup", (event) => {
      console.log("KEYUP", event)
      switch (event.key) {
        case "p":
          this.machine.send(this.isPaused ? "resume" : "pause")
          break
        case "d":
          this.stage.defaultCamera = this.stage.defaultCameraPosition === "playing" ? "overhead" : "playing"
          break
        case "c":
          DOM.body.classList.toggle("clear-interface")
          break
      }
    })

    const demonTotalElementa = [...document.querySelectorAll("[data-demon-total]")]
    demonTotalElementa.forEach((el) => (el.innerText = ENEMY_SETTINGS.totalSend))

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clockWasPaused = true
        this.machine.send("pause")
      }
    })

    this.onResize()
    setTimeout(() => this.onResize(), 500)
    window.addEventListener("resize", this.onResize)
    this.setupStats()

    this.tick()
  }

  onLocationRelease = (index) => {
    if (this.freeLocations.indexOf(index) < 0) this.freeLocations.push(index)
  }

  onResize = () => {
    this.stage.onResize()
    if (this.spellCaster) this.spellCaster.onResize()

    DOM.svg.setAttribute("width", DOM.body.offsetWidth)
    DOM.svg.setAttribute("height", DOM.body.offsetHeight)
  }

  createScene = () => {
    this.room = new Room()

    this.sim = new ParticleSim({ pixelRatio: this.stage.renderer.getPixelRatio() })
    if (window.DEBUG.simNoise || window.DEBUG.simFlow)
      this.viz = new SimViz(this.stage, this.sim, window.DEBUG.simFlow, window.DEBUG.simNoise)

    this.sceneObjects = new Group()
    this.sceneObjects.position.add(this.sim.startCoords)

    this.stage.add(this.sceneObjects)

    this.sim.particleMeshes.forEach((mesh) => {
      this.stage.add(mesh)
    })

    this.crystal = new Crystal(
      this.sim,
      () => this.machine.send("run"),
      () => this.machine.send("end")
    )

    this.room.add(this.crystal.group)

    this.entrances = [
      new Entrance(
        "door",
        [
          { x: 0.7, y: 0.35, z: -0.1 },
          { x: 0.47, y: 0.3, z: 0.05 },
        ],
        this.room.doorEnter
      ),
      new Entrance("bookcase", [
        { x: -0.1, y: 0.4, z: 0.45 },
        { x: 0.05, y: 0.4, z: 0.53 },
      ]),
      new Entrance("large-window", [
        { x: 1.01, y: 0.4, z: 0.5 },
        { x: 0.95, y: 0.5, z: 0.5 },
      ]),
      new Entrance(
        "trapdoor",
        [
          { x: 0.83, y: -0.1, z: 0.2 },
          { x: 0.83, y: 0.3, z: 0.2 },
        ],
        this.room.trapdoorEnter
      ),
    ]

    if (window.DEBUG.entrances) this.entrances.forEach((e) => e.createDebugMarkers(this.sceneObjects, this.sim.size))

    this.freeLocations = []
    const locationColors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00]
    this.enemyLocations = [
      { x: 0.25, y: 0, z: 0.3, r: Math.PI * 2 * 0.1 },
      { x: 0.8, y: 0, z: 0.4, r: Math.PI * 2 * 0.8 },
      { x: 0.6, y: 0, z: 0.2, r: Math.PI * 2 * 0.95 },
      { x: 0.2, y: 0, z: 0.7, r: Math.PI * 2 * 0.3 },
      { x: 0.81, y: 0, z: 0.68, r: Math.PI * 2 * 0.7 },
    ].map((d, i) => {
      return new Location(d, this.sim.size, this.entrances, this.onLocationRelease, locationColors[i])
    })

    this.enemyLocations.forEach((location, i) => {
      this.sceneObjects.add(location.group)
      location.index = i
      location.energyEmitter = new EnemyEnergyEmitter(this.sim, location.position)
      this.freeLocations.push(i)
    })
  }

  onStateChange = (state) => {
    this.appState = state.value

    if (state.changed || this.appState === "IDLE") {
      DOM.controls.innerHTML = ""
      if (this.winEmitter) this.winEmitter.active = false

      this.screens.update(this.appState)

      DOM.state.innerText = this.appState
      state.nextEvents.forEach((event) => {
        const button = document.createElement("BUTTON")
        button.innerHTML = event
        button.addEventListener("click", () => {
          this.machine.send(event)
        })
        DOM.controls.appendChild(button)
      })

      switch (this.appState) {
        case "IDLE":
          this.machine.send("load")
          break
        case "LOADING":
          ASSETS.load(
            () => {
              this.machine.send("complete")
            },
            (err) => {
              this.machine.send("error")
            }
          )
          break

        case "INIT":
          this.createScene()
          SOUNDS.init(this.stage)
          this.enemyPool = new EnemyPreloader(this.stage)
          this.stage.add(this.room.group)
          this.addEmitter(new DustEmitter(this.sim))
          this.winEmitter = new WinEmitter(this.sim)
          this.winEmitter.active = false
          this.addEmitter(this.winEmitter)

          this.spellLights = [0xffffff, 0xffffff, 0xffffff].map((color) => this.makePointLight(color))
          this.spellLightsCount = -1

          this.spellCaster = new SpellCaster(
            this.sim,
            this.sceneObjects,
            this.stage,
            DOM.canvas,
            (spellID) => {
              DOM.spellGuide.classList.remove("show")
              console.log("casting spell ", spellID)
              switch (spellID) {
                case "arcane":
                  let arcaneEnemies = this.getEnemy(spellID, 1)
                  arcaneEnemies.forEach((enemy) => {
                    let spell = new ArcaneSpellEmitter(this.sim, this.spellLight, this.spellCaster.emitPoint, enemy)
                    this.addEmitter(spell)
                  })
                  break
                case "fire":
                  let fireEnemies = this.getEnemy(spellID, 2)
                  fireEnemies.forEach((enemy) => {
                    let spell = new FireSpellEmitter(this.sim, this.spellLight, this.spellCaster.emitPoint, enemy)
                    this.addEmitter(spell)
                  })
                  break
                case "vortex":
                  let spell = new VortexSpellEmitter(this.sim, this.spellLight, this.spellCaster.emitPoint)
                  this.machine.send("special")
                  this.addEmitter(spell)
                  break
              }
            },
            () => {}
          )

          const torchPositions = [
            { x: 0.036, y: 0.45, z: 0.845 },
            { x: 0.14, y: 0.45, z: 0.035 },
            { x: 0.865, y: 0.45, z: 0.035 },
            { x: 0.952, y: 0.63, z: 0.632 },
          ]

          this.torches = torchPositions.map((position) => {
            const torch = new Torch(this.sim, position, this.noise)
            this.sceneObjects.add(torch.light)

            return torch
          })

          this.room.afterCompile = () => {
            setTimeout(() => {
              this.machine.send("begin")
            }, 500)
          }

          break
        case "TITLE_SCREEN":
          this.stage.reveal()
          this.staggerTorchesOff()
          this.room.hide()
          this.resetRotation()
          this.stage.useOrbitControls = false
          this.stage.moveCamera("crystalOffset")
          break
        case "SCENE_DEBUG":
          this.resetRotation()
          this.stage.moveCamera("playing")
          this.stage.useOrbitControls = true
          this.room.show()
          this.staggerTorchesOn()
          this.enemyState.sendCount = 0
          break
        case "SETUP_GAME":
          this.startGame()
          break
        case "SETUP_ENDLESS":
          this.startEndless()
          break
        case "INSTRUCTIONS_CRYSTAL":
          this.resetRotation()
          this.room.hide()
          this.stage.moveCamera("crystalIntro")
          SOUNDS.startMusic()
          break
        case "INSTRUCTIONS_DEMON":
          this.resetLocations()
          this.enemyState = { ...ENEMY_SETTINGS }
          this.stage.moveCamera("demon")
          const demoDemon = this.addEnemy(this.enemyLocations[0], "arcane")
          console.log("demoDemon:", demoDemon)
          demoDemon.onDeadCallback = () => {
            this.machine.send("next")
          }
          break
        case "INSTRUCTIONS_CAST":
          setTimeout(() => {
            DOM.spellGuide.classList.add("show")
          }, 500)
          this.stage.moveCamera("spellLesson")
          this.spellCaster.reset(true)
          this.spellCaster.activate("arcane")
          break
        case "INSTRUCTIONS_SPELLS":
          this.stage.moveCamera("playing")
          this.spellCaster.deactivate()
          this.room.show(0.2)
          break
        case "GAME_RUNNING":
        case "ENDLESS_MODE":
          this.resumeGame()
          break
        case "PAUSED":
        case "ENDLESS_PAUSE":
          this.pauseGame()
          break
        case "SPECIAL_SPELL":
        case "ENDLESS_SPECIAL_SPELL":
          this.yayItsVortexTime()
          break
        case "SPELL_OVERLAY":
        case "ENDLESS_SPELL_OVERLAY":
          this.pauseGame()
          break
        case "CLEAR_GAME":
        case "CLEAR_ENDLESS":
          this.endGame()
          this.machine.send("end")
          break
        case "GAME_OVER_ANIMATION":
          this.endGame()
          this.room.hide()
          this.stage.moveCamera("crystal")
          this.crystal.explode()
          break
        case "RESETTING_FOR_INSTRUCTIONS":
          this.crystal.reset()
          break
        case "RESETTING_FOR_CREDITS":
          this.crystal.reset()
          break
        case "GAME_OVER":
          break
        case "WIN_ANIMATION":
          this.endGame()
          this.room.hide()
          this.machine.send("end")
          this.rotate()
          break
        case "WINNER":
          this.stage.moveCamera("win")
          setTimeout(() => (this.winEmitter.active = true), 500)
          break
        case "CREDITS":
          this.resetRotation()
          this.room.show(0.2)
          this.staggerTorchesOn()
          this.stage.moveCamera("bookshelf")
          SOUNDS.startMusic()
          break

        default:
          break
      }
    }
  }

  yayItsVortexTime() {
    this.spellCaster.deactivate()
    this.torches.forEach((torch, i) => {
      gsap.delayedCall(i * 0.1, () => torch.green())
    })

    gsap.delayedCall(1.3, () => {
      this.stage.moveCamera("vortex")
      this.enemies.forEach((enemy) => {
        if (enemy && enemy.state === "ALIVE") {
          enemy.getSuckedIntoTheAbyss()
        }
      })
      this.room.showVortex(() => {
        gsap.delayedCall(1, () => {
          this.room.hideVortex(() => {
            if (this.appState === "SPECIAL_SPELL" || this.appState === "ENDLESS_SPECIAL_SPELL")
              this.staggerTorchesOn(true)

            this.machine.send("complete")
          })
        })
      })
    })
  }

  resetLocations() {
    this.freeLocations = []
    this.enemyLocations.forEach((location, i) => {
      this.freeLocations.push(i)
    })

    this.enemyPool.resetAll()
  }

  staggerTorchesOn(instant = false) {
    this.torches.forEach((torch, i) => {
      gsap.delayedCall((instant ? 0 : 1.5) + i * 0.1, () => torch.on())
    })
  }

  staggerTorchesOff() {
    this.torches.forEach((torch, i) => {
      gsap.delayedCall(i * 0.1, () => torch.off())
    })
  }

  setInitialStates() {
    SOUNDS.startMusic()
    this.resetLocations()
    this.spellCaster.reset(this.appState === "SETUP_ENDLESS")
    this.staggerTorchesOn()
    this.health = 1
    this.elapsedGameTime = 0
    this.room.show()
  }

  setupStats() {
    if (window.DEBUG.fps) {
      this.stats = new Stats()
      const element = document.querySelector("#fps")
      element.style.display = "block"
      element.appendChild(this.stats.dom)
    }
  }

  startGame() {
    this.enemyState = { ...ENEMY_SETTINGS, lastSent: 2.5 }
    this.setInitialStates()
    this.endlessMode = false
    this.crystal.reset()
  }

  startEndless() {
    this.enemyState = { ...ENEMY_SETTINGS, sendFrequency: 2 }
    this.setInitialStates()
    this.endlessMode = true
    this.crystal.reset()
  }

  pauseGame() {
    this.room.pause()
    this.spellCaster.deactivate()
    this.stage.moveCamera("paused")
    this.emitters.forEach((e) => e.pause())
    this.enemies.forEach((e) => e.pause())
    this.stage.paused = true

    this.stage.useOrbitControls = true
  }

  resumeGame() {
    this.room.resume()
    this.stage.paused = false
    this.stage.useOrbitControls = false
    this.spellCaster.activate()
    this.stage.moveCamera("playing")
    this.emitters.forEach((e) => e.resume())
    this.enemies.forEach((e) => e.resume())
    this.resetRotation()
  }

  endGame() {
    this.spellCaster.deactivate()
    this.staggerTorchesOff()
    this.enemies.forEach((e) => e.accend())
  }

  getEnemy(type, count) {
    if (!type) return null
    const toReturn = []
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i]
      if (enemy.state === "ALIVE" && toReturn.length < count) {
        toReturn.push(enemy)
      }
    }

    if (toReturn.length) return toReturn
    return [null]
  }

  makePointLight = (color) => {
    const pointLight = new PointLight(color, 0, 0.8)
    this.sceneObjects.add(pointLight)

    return pointLight
  }

  addEmitter(emitter) {
    if (emitter.model) {
      console.log("model", emitter.model)
      this.sceneObjects.add(emitter.model.group)
    }
    this.emitters.push(emitter)
  }

  getFreeLocation() {
    if (!this.freeLocations.length) return null

    const i = Math.floor(Math.random() * this.freeLocations.length)
    const nextLocation = this.freeLocations.splice(i, 1)
    return this.enemyLocations[nextLocation]
  }

  updateOnScreenEnemyInfo() {
    DOM.demonCount.innerText = this.enemyState.killCount
  }

  addEnemy(forceLocation, forceSpell) {
    if (["GAME_RUNNING", "ENDLESS_MODE", "INSTRUCTIONS_DEMON"].indexOf(this.appState) >= 0) {
      const location = forceLocation ? forceLocation : this.getFreeLocation()
      if (location && this.enemyState.sendCount < this.enemyState.totalSend) {
        const enemy = new Enemy(this.sim, this.enemyPool.borrowDemon(), forceSpell)
        enemy.spawn(location)
        if (enemy.emitter) this.addEmitter(enemy.emitter)

        enemy.onDeadCallback = () => {
          this.enemyState.killCount++
          if (this.enemyState.killCount === this.enemyState.totalSend) this.machine.send("win")
        }
        if (this.appState === "GAME_RUNNING") this.enemyState.sendCount++
        this.enemies.push(enemy)

        return enemy
      }
    }
    return null
  }

  rotate() {
    this.rotating = true
    gsap.to(this, { rotationSpeed: 0.2, duration: 1, ease: "power2.in" })
  }

  resetRotation() {
    this.rotating = false
    const goClockwise = this.stage.everything.rotation.y > Math.PI ? true : false
    gsap.to(this, { rotationSpeed: 0, duration: 1, ease: "power2.out" })
    gsap.to(this.stage.everything.rotation, { y: goClockwise ? Math.PI * 2 : 0, duration: 1, ease: "power2.inOut" })
  }

  tick() {
    if (this.stats) this.stats.begin()

    this.updateOnScreenEnemyInfo()

    document.body.style.setProperty("--health", this.health)

    let delta = this.clock.getDelta()

    if (this.clockWasPaused) {
      delta = 0
      this.clockWasPaused = false
    }

    if (this.spellCaster) {
      const rechargeableStates = ["GAME_RUNNING", "ENDLESS_MODE", "SPECIAL_SPELL", "ENDLESS_SPECIAL_SPELL"]
      if (rechargeableStates.includes(this.appState)) {
        this.spellCaster.tick(delta)
      }
    }

    if (this.sim) {
      if (!this.isPaused) {
        this.elapsedGameTime += delta
        this.animations.map((mixer) => {
          mixer.update(delta * mixer.timeScale)
        })

        for (let i = this.emitters.length - 1; i >= 0; i--) {
          let emitter = this.emitters[i]
          if (emitter === null || emitter.destroyed) {
            emitter = null
            this.emitters.splice(i, 1)
          } else {
            emitter.tick(delta, this.elapsedGameTime)
          }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
          let enemy = this.enemies[i]
          if (enemy === null || enemy.dead) {
            enemy = null
            this.enemies.splice(i, 1)
          } else {
            enemy.tick(delta, this.elapsedGameTime)
          }
        }

        for (let i = this.torches.length - 1; i >= 0; i--) {
          this.torches[i].tick(delta, this.elapsedGameTime)
        }

        const es = this.enemyState

        if (this.endlessMode && this.enemies.length) {
          es.lastSent = 0
        }

        if (this.isPlaying) {
          es.lastSent += delta
          if (es.lastSent >= es.sendFrequency) {
            if (!this.endlessMode || !this.enemies.length) {
              es.lastSent = 0
              es.sendFrequency -= es.sendFrequencyReduceBy
              if (es.sendFrequency < es.minSendFrequency) es.sendFrequency = es.minSendFrequency

              this.addEnemy()
            }
          }
        }

        if (this.isPlaying && !this.endlessMode) {
          this.health += this.healthReplenish * delta
          this.health -= this.enemies.length * (this.healthDecay * delta)
          this.health = Math.min(1, Math.max(0, this.health))
        }

        if (this.isPlaying && this.health <= 0) this.machine.send("game-over")

        this.sim.step(delta, this.elapsedGameTime)
        if (this.viz) this.viz.tick()
      }

      if (this.rotating) {
        this.stage.everything.rotation.y += this.rotationSpeed * delta
        this.stage.everything.rotation.y = this.stage.everything.rotation.y % (Math.PI * 2)
      }

      for (let i = this.enemyLocations.length - 1; i >= 0; i--) {
        const location = this.enemyLocations[i]
        if (location.energyEmitter) location.energyEmitter.tick(delta, this.elapsedGameTime)
      }

      this.stage.render()
      this.frame++
    }

    if (this.room) this.room.tick(delta, this.elapsedGameTime)

    if (this.crystal) this.crystal.tick(delta)

    if (this.stats) this.stats.end()
    window.requestAnimationFrame(() => this.tick())
  }

  get spellLight() {
    this.spellLightsCount++
    return this.spellLights[this.spellLightsCount % this.spellLights.length]
  }

  get isPaused() {
    return ["PAUSED", "ENDLESS_PAUSE", "SPELL_OVERLAY", "ENDLESS_SPELL_OVERLAY"].indexOf(this.appState) >= 0
  }

  get isPlaying() {
    return ["GAME_RUNNING", "ENDLESS_MODE"].indexOf(this.appState) >= 0
  }
}
