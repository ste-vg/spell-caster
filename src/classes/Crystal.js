import gsap from "gsap"
import { ASSETS } from "./Assets"
import { DoubleSide, Mesh, MeshMatcapMaterial, PlaneGeometry, ShaderMaterial } from "three"

import noise from "../shaders/shared/noise.glsl"
import { CrystalMachine } from "../machines/crystal-machine"
import { interpret } from "xstate"
import { CrystalEnergyEmitter } from "./emitters/CrystalEnergyEmitter"
import { CrystalLight } from "./lights/CrystalLight"

import vertexShader from "../shaders/beam/vert.glsl"
import fragmentShader from "../shaders/beam/frag.glsl"
import { SOUNDS } from "./sounds/SoundController"

export class Crystal {
  constructor(sim, onWhole, onBroken) {
    this.machine = interpret(CrystalMachine)
    this.state = this.machine.initialState.value

    this.wholeCallback = onWhole
    this.brokeCallback = onBroken

    this.model = ASSETS.getModel("crystal")

    this.energy = new CrystalEnergyEmitter(sim)

    this.smashItems = []
    this.beams = []
    this.group = this.model.group
    this.scene = this.model.scene
    this.crystal = null

    this.position = {
      x: 0,
      y: -0.05,
      z: 0.165,
    }

    this.spin = 1
    this.brokenSpin = 0
    this.glitch = 0

    this.elapsedTime = 0

    this.uniforms = {
      uTime: { value: 0 },
      uGlow: { value: 0 },
    }

    this.material = new MeshMatcapMaterial({
      side: DoubleSide,
    })

    this.light = new CrystalLight({ x: 0, y: 0.05, z: 0 }, sim.size)
    this.group.add(this.light.light)

    this.material.matcap = ASSETS.getTexture("crystal-matcap")
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime
      shader.uniforms.uGlow = this.uniforms.uGlow

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `
    		uniform float uGlow;

    		#include <common>
    	`
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <output_fragment>",
        `#include <output_fragment>

    		

    		vec3 color = mix(gl_FragColor.rgb, vec3(1.0), uGlow);
    		gl_FragColor = vec4(color, gl_FragColor.a);
    	`
      )
    }

    this.model.scene.traverse((item) => {
      if (item.type === "Mesh") {
        item.material = this.material
        if (item.name === "Ruby") {
          this.crystal = item
        } else {
          this.smashItems.push(item)
          item.home = {
            position: item.position.clone(),
            rotation: item.rotation.clone(),
            scale: item.scale.clone(),
          }
          item.random = {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
            z: Math.random() * 2 - 1,
          }
        }
      }
    })

    const beams = [
      {
        x: 0,
        y: Math.PI * 2 * 0,
        z: 0,
      },
      {
        x: 0,
        y: Math.PI * 2 * 0.33,
        z: 0.5,
      },
      {
        x: 0,
        y: Math.PI * 2 * 0.66,
        z: -1,
      },
    ]

    this.beams = beams.map((r) => {
      const plane = new PlaneGeometry(8, 2)
      const material = new ShaderMaterial({
        side: DoubleSide,
        transparent: true,
        vertexShader,
        fragmentShader,
      })

      const mesh = new Mesh(plane, material)
      mesh.rotation.set(r.x, r.y, r.z)
      mesh.visible = false
      this.scene.add(mesh)

      return mesh
    })

    this.machine.onTransition((s) => this.onStateChange(s))
    this.machine.start()
  }

  onStateChange = (state) => {
    this.state = state.value

    if (state.changed || this.state === "IDLE") {
      switch (this.state) {
        case "IDLE":
          this.machine.send("start")
          break
        case "INIT":
          this.machine.send("ready")
        case "WHOLE":
          this.showFull()
          this.energy.active = true
          if (this.wholeCallback) this.wholeCallback()
          break
        case "OVERLOADING":
          this.energy.active = false
          SOUNDS.play("glitch")
          this.overloadAnimation()
          break
        case "BREAKING":
          this.showBroken()
          SOUNDS.play("crystal-explode")
          this.explodeAnimation()
          break
        case "BROKEN":
          if (this.brokeCallback) this.brokeCallback()
          break
        case "FIXING":
          this.energy.active = true
          setTimeout(() => SOUNDS.play("crystal-reform"), 200)
          this.rewindAnimation()
          break
      }
    }
  }

  showFull() {
    this.crystal.visible = true
    this.smashItems.forEach((item) => (item.visible = false))
  }

  showBroken() {
    this.crystal.visible = false
    this.smashItems.forEach((item) => (item.visible = true))
  }

  spinDown() {
    gsap.to(this, {
      spin: 0,
      duration: 2.5,
      ease: "power2.inOut",
    })
  }

  spinUp() {
    gsap.to(this, {
      spin: 1,
      duration: 2.5,
      ease: "power2.inOut",
    })
  }

  brokenSpinUp() {
    gsap.to(this, {
      brokenSpin: 1,
      duration: 1,
      ease: "power2.inOut",
    })
  }

  brokenSpinDown() {
    this.brokenSpin = 0
  }

  glitchSpinUp() {
    gsap.to(this, {
      glitch: 1,
      duration: 2,
      ease: "power3.in",
    })
    gsap.to(this.uniforms.uGlow, {
      value: 0.5,
      duration: 4,
      ease: "power2.in",
    })
  }

  glitchSpinDown() {
    this.glitch = 0
    gsap.to(this.uniforms.uGlow, {
      value: 0,
      duration: 1,
      ease: "power2.out",
    })
  }

  overloadAnimation() {
    this.spinDown()
    this.glitchSpinUp()

    gsap.to(this.group.scale, { x: 1.5, z: 1.5, y: 1.5, ease: "power1.in", duration: 4 })

    const tl = gsap.timeline({
      defaults: { duration: 0.4, ease: "power2.inOut" },
      onComplete: () => this.machine.send("break"),
    })

    const rotationOffset = this.group.rotation.y % (Math.PI * 2)

    tl.to(
      this.scene.rotation,
      {
        x: "+=" + Math.PI * 0,
        y: "+=" + Math.PI * 2 * 0.33,
        z: "+=" + Math.PI * 0,
        onComplete: () => (this.beams[0].visible = true),
      },
      1
    )
    tl.to(
      this.scene.rotation,
      {
        x: "+=" + Math.PI * 0,
        y: "+=" + Math.PI * 2 * 0.33,
        z: "+=" + Math.PI * 0,
        onComplete: () => (this.beams[2].visible = true),
      },
      2
    )
    tl.to(
      this.scene.rotation,
      {
        x: "+=" + Math.PI * 0,
        y: "+=" + Math.PI * 2 * 0.33,
        z: "+=" + Math.PI * 0.25,
        onComplete: () => (this.beams[1].visible = true),
      },
      3
    )
    tl.to(this.scene.rotation, {}, 3.5)
  }

  explodeAnimation() {
    const duration = 3
    this.showBroken()
    this.glitchSpinDown()
    this.brokenSpinUp()
    this.beams.forEach((beam) => (beam.visible = false))

    gsap.delayedCall(duration * 0.8, () => {
      this.machine.send("broke")
    })
    this.smashItems.forEach((item) => {
      gsap.to(item.position, {
        x: Math.random() * 10 - 5,
        y: Math.random() * 5 - 1,
        z: Math.random() * 8 - 4,
        ease: "power4.out",
        duration,
      })
    })
  }

  rewindAnimation() {
    const duration = 2
    this.brokenSpinDown()
    gsap.delayedCall(duration * 0.5, () => {
      if (this.wholeCallback) this.wholeCallback()
    })
    this.spinUp()
    gsap.delayedCall(duration, () => this.machine.send("fixed"))
    gsap.to(this.scene.rotation, { x: 0, y: "+=" + Math.PI * 3, z: 0, ease: "power4.inOut", duration: duration * 1.5 })
    gsap.to(this.group.scale, { x: 1, z: 1, y: 1, ease: "power4.inOut", duration: duration * 1.5 })
    this.smashItems.forEach((item) => {
      gsap.to(item.position, {
        ...item.home.position,
        duration,
        ease: "power2.inOut",
      })
      gsap.to(item.rotation, {
        x: item.home.rotation.x,
        y: item.home.rotation.y,
        z: item.home.rotation.z,
        duration,
        ease: "power2.inOut",
      })
    })
  }

  explode() {
    this.machine.send("overload")
  }

  reset() {
    if (this.state === "WHOLE") {
      if (this.wholeCallback) this.wholeCallback()
    } else this.machine.send("fix")
  }

  tick(delta) {
    this.elapsedTime += delta
    this.uniforms.uTime.value = this.elapsedTime

    const float = Math.cos(this.elapsedTime) * 0.015

    this.group.rotation.x = Math.cos(this.elapsedTime) * 0.1 * this.spin
    this.group.rotation.z = Math.cos(this.elapsedTime) * 0.07 * this.spin
    this.group.rotation.y += 0.5 * delta * this.spin

    this.group.position.x = this.position.x
    this.group.position.y = this.position.y + float * this.spin
    this.group.position.z = this.position.z

    if (this.light) this.light.tick(delta, this.elapsedTime)
    if (this.energy) this.energy.tick(delta, this.elapsedTime)

    const rotateFactor = 0.25
    if (this.brokenSpin > 0) {
      this.smashItems.forEach((item) => {
        item.rotation.x += delta * item.random.x * rotateFactor * this.brokenSpin
        item.rotation.y += delta * item.random.y * rotateFactor * this.brokenSpin
        item.rotation.z += delta * item.random.z * rotateFactor * this.brokenSpin
      })
    }

    const glitchAmount = 0.007
    if (this.glitch > 0) {
      this.scene.position.x = (Math.random() - 0.5) * glitchAmount * this.glitch
      this.scene.position.y = (Math.random() - 0.5) * glitchAmount * this.glitch
      this.scene.position.z = (Math.random() - 0.5) * glitchAmount * this.glitch
    }
  }
}
