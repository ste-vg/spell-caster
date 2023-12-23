import { interpret } from "xstate"
import { GhostEmitter } from "../emitters/GhostEmitter"
import { EnemyMachine } from "../../machines/enemy-machine"
import { gsap } from "gsap"
import { SPELLS } from "../../consts"
import { SOUNDS } from "../sounds/SoundController"

export class Enemy {
  constructor(sim, demon, spell) {
    this.machine = interpret(EnemyMachine)
    this.sim = sim
    this.timeOffset = Math.random() * (Math.PI * 2)
    this.state = this.machine.initialState.value

    this.uniforms = demon.uniforms
    this.onDeadCallback = null

    this.animations = []

    const availableSpellTypes = Object.keys(SPELLS).map((key) => SPELLS[key])
    this.spellType = spell ? spell : availableSpellTypes[Math.floor(Math.random() * availableSpellTypes.length)]

    this.demon = demon
    this.model = demon.demon

    this.elements = {
      leftHand: null,
      rightHand: null,
      sphere: null,
      cloak: null,
      skullParts: [],
    }

    this.model.scene.traverse((item) => {
      if (this.elements[item.name] === null) this.elements[item.name] = item
      else if (item.name.includes("skull")) this.elements.skullParts.push(item)

      if (item.name === "cloak") {
        item.material.onBeforeCompile = (shader) => {
          console.log("COMPILING SHADER")
        }
      }
    })

    this.modelOffset = { x: 0, y: -0.6, z: 0 }
    this.group = this.model.group
    this.position = { x: 0, y: 0, z: 0 }
    this.emitter = new GhostEmitter(sim)
    this.emitter.emitRate = 0
    this.machine.onTransition((s) => this.onStateChange(s))
    this.machine.start()
  }

  moveFunction(delta, elapsedTime) {
    if (this.state === "ALIVE" || this.state === "TAGGED") {
      this.position.y = 0.2 + 0.15 * ((Math.sin(elapsedTime + this.timeOffset) + 1) * 0.5)
    }
  }

  pause() {
    this.animations.map((animation) => animation.pause())
  }

  resume() {
    this.animations.map((animation) => animation.resume())
  }

  spawn(location) {
    this.location = location
    this.location.add(this.group)
    this.group.rotation.y = this.location.rotation
    this.model.scene.visible = false

    this.machine.send("spawn")
  }

  incoming() {
    this.machine.send("incoming")
  }

  kill() {
    this.machine.send("kill")
  }

  accend() {
    this.machine.send("accend")
  }

  getSuckedIntoTheAbyss() {
    this.machine.send("vortex")
  }

  onStateChange = (state) => {
    this.state = state.value
    if (state.changed || this.state === "IDLE") {
      switch (this.state) {
        case "IDLE":
          this.model.scene.rotation.set(0, 0, 0)
          break
        case "ANIMATING_IN":
          if (this.location) {
            SOUNDS.play("enter")
            const entrancePath = this.location.getRandomEntrance()
            this.animations.push(
              gsap.fromTo(
                this.position,
                { ...entrancePath.points[0] },
                {
                  motionPath: { path: entrancePath.points, curviness: 2 },
                  ease: "none",
                  duration: 1.1,
                  onStart: () => {
                    setTimeout(() => {
                      this.emitter.animatingIn()
                    }, 100)
                  },
                }
              )
            )

            this.animations.push(gsap.from(this.elements.leftHand.position, { z: -0.1, duration: 2 }))
            this.animations.push(gsap.from(this.elements.leftHand.scale, { x: 0, y: 0, z: 0, duration: 2 }))

            this.animations.push(gsap.from(this.elements.rightHand.position, { z: -0.1, duration: 2 }))
            this.animations.push(gsap.from(this.elements.rightHand.scale, { x: 0, y: 0, z: 0, duration: 2 }))

            this.elements.skullParts.forEach((part) => {
              this.animations.push(
                gsap.from(part.rotation, {
                  y: (Math.random() - 0.5) * 0.1,
                  x: 1.5,

                  ease: "power2.inOut",
                  delay: 0.8,
                  duration: 1,
                })
              )
              this.animations.push(gsap.from(part.scale, { x: 0.2, y: 4, z: 0.2, delay: 0.8, duration: 1 }))
              this.animations.push(gsap.from(part.position, { y: 0.1, delay: 0.8, duration: 1 }))
            })

            this.animations.push(gsap.from(this.elements.cloak.scale, { y: 0.2, duration: 1.7 }))

            this.animations.push(gsap.delayedCall(1, this.machine.send, ["complete"]))
            const trail = entrancePath.trail
            const material = trail.material

            entrancePath.entrance.enter()

            this.animations.push(
              gsap.fromTo(
                material.uniforms.progress,
                { value: 0 },
                {
                  duration: 1.1,
                  delay: 0.2,
                  value: 1,
                  ease: "none",
                  onStart: () => {
                    trail.visible = true
                  },
                  onComplete: () => {
                    trail.visible = false
                  },
                }
              )
            )
          } else {
            this.machine.send("complete")
          }
          break
        case "ALIVE":
          SOUNDS.play("laugh")
          this.emitter.puffOfSmoke()
          this.emitter.idle()
          this.model.scene.visible = true
          this.location.energyEmitter.start()
          this.animations.push(
            gsap.fromTo(
              this.model.scene.scale,
              { x: 0.1, y: 0.001, z: 0.1 },
              { x: 0.9, y: 0.9, z: 0.9, ease: "power4.out", duration: 0.2 }
            )
          )
          this.animations.push(gsap.fromTo(this.modelOffset, { y: 0 }, { y: -0.05, ease: "back", duration: 0.5 }))
          break
        case "TAGGED":
          break
        case "ANIMATING_OUT":
          this.emitter.puffOfSmoke()
          this.emitter.destory()
          this.location.energyEmitter.stop()
          this.animations.push(
            gsap.to(this.elements.cloak.scale, {
              x: 12,
              y: 9,
              z: 9,
              ease: "power3.out",
              duration: 1.5,
            })
          )

          this.animations.push(
            gsap.to(this.uniforms.out, {
              value: 1,
              ease: "back.in",
              delay: 0.2,
              duration: 1,
              onComplete: () => {
                this.emitter.puffOfSmoke(true)
                this.machine.send("complete")
              },
            })
          )

          this.elements.skullParts.forEach((part) => {
            const duration = 1 + Math.random() * 0.3
            this.animations.push(
              gsap.to(part.position, {
                delay: 0.15,
                y: (Math.random() - 0.5) * 0.1,
                x: (Math.random() - 0.5) * 0.3,
                z: (Math.random() - 0.5) * 0.3,
                ease: "back.in",
                duration,
              })
            )
            this.animations.push(
              gsap.to(part.rotation, {
                delay: 0,
                y: (Math.random() - 0.5) * 0.8,
                x: (Math.random() - 0.5) * 0.8,
                z: (Math.random() - 0.5) * 0.8,
                ease: "power2.inOut",
                duration,
              })
            )
            this.animations.push(
              gsap.to(part.scale, {
                delay: 0.2,
                y: 0,
                x: 0,
                z: 0,
                ease: "back.in",
                duration: duration * 0.6,
              })
            )

            this.animations.push(
              gsap.to(this.elements.leftHand.scale, {
                x: 0,
                y: 0,
                z: 0,
                ease: "power3.out",
                duration: 0.6,
              })
            )

            this.animations.push(
              gsap.to(this.elements.rightHand.scale, {
                x: 0,
                y: 0,
                z: 0,
                ease: "power3.out",
                duration: 0.6,
              })
            )
          })
          break
        case "VORTEX_ANIMATION":
          this.emitter.destory()
          this.location.energyEmitter.stop()

          const mainDelay = Math.random() * 0.5
          const moveDelay = mainDelay + 1.5

          this.animations.push(
            gsap.to(this.modelOffset, {
              y: -1,
              z: 0.2,
              ease: "power4.in",
              duration: 1,
              delay: moveDelay,
              onComplete: () => this.machine.send("complete"),
            })
          )

          this.animations.push(
            gsap.to(this.model.scene.rotation, {
              y: Math.random() * 2,

              ease: "power4.in",
              duration: 1.5,
              delay: mainDelay + 1,
            })
          )

          this.animations.push(
            gsap.to(this.model.scene.scale, {
              y: 1.2,

              ease: "power4.in",
              duration: 1.5,
              delay: mainDelay + 1,
            })
          )

          this.animations.push(
            gsap.to(this.uniforms.stretch, {
              value: 1,
              ease: "power4.in",
              delay: mainDelay,
              duration: 2,
            })
          )

          break
        case "DEAD":
          this.destory()
          break
        case "GONE":
          this.emitter.destory()
          this.destory()
          break
        case "ACCEND":
          this.location.energyEmitter.stop()
          this.animations.push(
            gsap.to(this.position, {
              y: 1.1,
              ease: "Power4.in",
              duration: 0.6,
              delay: Math.random(),
              onStart: () => this.emitter.puffOfSmoke(),
              onComplete: () => {
                this.destory()
                this.machine.send("leave")
              },
            })
          )
      }
    }
  }

  resetDemon() {
    this.uniforms.in.value = 0
    this.uniforms.out.value = 0
    this.uniforms.stretch.value = 0
    this.model.scene.traverse((item) => {
      if (item.isMesh) {
        const types = ["position", "rotation", "scale"]
        types.forEach((type) => {
          item[type].set(item.home[type].x, item.home[type].y, item.home[type].z)
        })
      }
    })
  }

  destory() {
    if (this.model) {
      this.group.removeFromParent()
      this.resetDemon()
      this.demon.returnToPool()
    }

    this.animations.forEach((animation) => {
      animation.kill()
      animation = null
    })

    if (this.location) this.location.release()

    if (this.onDeadCallback) {
      this.onDeadCallback()
      this.onDeadCallback = null
    }
  }

  tick(delta, elapsedTime) {
    this.uniforms.time.value = elapsedTime
    this.moveFunction(delta, elapsedTime)

    this.group.position.set(
      this.position.x * this.sim.size.x,
      this.position.y * this.sim.size.y,
      this.position.z * this.sim.size.z
    )

    this.model.scene.position.set(
      this.modelOffset.x * this.sim.size.x,
      this.modelOffset.y * this.sim.size.y,
      this.modelOffset.z * this.sim.size.z
    )

    if (this.location)
      this.emitter.position = {
        x: this.position.x + this.location.position.x,
        y: this.position.y + this.location.position.y,
        z: this.position.z + this.location.position.z,
      }
  }

  get dead() {
    return this.state === "DEAD" || this.state === "GONE"
  }

  get active() {
    return this.state === "ALIVE"
  }
}
