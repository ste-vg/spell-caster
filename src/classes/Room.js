import {
  Color,
  ConeGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three"
import { ASSETS } from "./Assets"
import { gsap } from "gsap"
import { SOUNDS } from "./sounds/SoundController"
import { FragmentShader } from "../shaders/FragmentShader"
import vortexFragmentShader from "../shaders/vortex/frag.glsl"
import vortexVertexShader from "../shaders/vortex/vert.glsl"
export class Room {
  constructor() {
    this.group = new Group()
    this.group.scale.set(0.7, 0.72, 0.7)
    this.group.position.set(0, -0.03, -0.12)
    this.paused = false

    this.uniforms = []
    this.items = {
      "trapdoor-door": null,
      "door-right": null,
      "sub-floor": null,
      bookshelf: null,
    }

    this.afterCompile = null

    this.allItems = []
    this.vortexItems = []

    const room = ASSETS.getModel("room")
    this.group.add(room.group)
    this.scene = room.scene

    this.skirt = new Mesh(new PlaneGeometry(2, 1), new MeshBasicMaterial({ color: new Color("#000000") }))
    this.skirt.position.set(0, -0.77, 0.9)
    this.group.add(this.skirt)

    const vortexGeometry = new ConeGeometry(0.7, 1, 100, 1, true, Math.PI)
    this.vortexMaterial = new ShaderMaterial({
      vertexShader: vortexVertexShader,
      fragmentShader: FragmentShader(vortexFragmentShader),
      side: DoubleSide,
      uniforms: {
        uTime: { value: 0 },
      },
    })

    this.vortex = new Mesh(vortexGeometry, this.vortexMaterial)
    this.vortex.position.set(0, -0.77, 0.165)
    this.vortex.rotation.x = Math.PI
    this.vortex.visible = false
    this.group.add(this.vortex)

    room.scene.traverse((item) => {
      /* 
        We want the shader to compile before the game starts. 
        We take a bit of a hit on performance on zoomed in scenes 
        but most of the time the whole room is in view anyways.
      */
      item.frustumCulled = false

      if (this.items[item.name] !== undefined) {
        const object = item
        this.items[item.name] = {
          object,
          uniforms: {},
          originalPosition: { x: object.position.x, y: object.position.y, z: object.position.z },
          originalRotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
        }
      }

      if (item.type === "Mesh") {
        this.allItems.push(item)

        item.home = {
          position: item.position.clone(),
          rotation: item.rotation.clone(),
          scale: item.scale.clone(),
        }

        const itemWorldPos = new Vector3()
        item.getWorldPosition(itemWorldPos)
        const distance = 0.3
        const vortexable =
          item.name !== "sub-floor" && Math.abs(itemWorldPos.x) < distance && Math.abs(itemWorldPos.z) < distance

        if (vortexable) {
          this.vortexItems.push({
            worldPosition: itemWorldPos,
            distance: Math.abs(itemWorldPos.x) + Math.abs(itemWorldPos.z),
            item,
          })
        }

        item.pointsUvs = true

        item.material.defines.USE_UV = ""

        item.material.onBeforeCompile = (shader) => {
          const uniform = { value: 0 }
          this.uniforms.push(uniform)

          shader.uniforms.progress = uniform
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            `
            uniform float progress;
            // varying vec2 vUv;
            #include <common>
            `
          )
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <output_fragment>",
            `#include <output_fragment>

              // float noise = snoise(vUv);
             
              vec3 blackout = mix(vec3(0.0), gl_FragColor.rgb, progress);

              gl_FragColor = vec4(blackout, gl_FragColor.a);
            `
          )

          if (this.afterCompile) {
            this.afterCompile()
            this.afterCompile = null
          }
        }
      }
    })
  }

  show(amount = 1) {
    const duration = 2.5

    this.scene.visible = true

    gsap.killTweensOf(this.uniforms)
    gsap.to(this.uniforms, {
      value: amount,
      ease: "power1.in",
      duration,
    })
  }

  hide(instant = false) {
    console.log("HIDE ROOM")
    const duration = instant ? 0 : 1.5
    gsap.killTweensOf(this.uniforms)
    gsap.to(this.uniforms, {
      value: 0.0,
      duration,
      onComplete: () => {
        this.scene.visible = false
      },
    })
  }

  showVortex(cb) {
    const duration = 1

    this.vortexMaterial.uniforms.uTime.value = 0
    this.vortex.visible = true
    gsap.fromTo(this.vortex.scale, { y: 0.4 }, { y: 1, duration, delay: 0.5 })
    const getRandomAngle = () => Math.random() * (Math.PI * 0.5) - Math.PI * 0.25

    SOUNDS.play("portal")
    setTimeout(() => {
      SOUNDS.play("crumble")
    }, 300)

    this.items["sub-floor"].object.visible = false
    for (let i = 0; i < this.vortexItems.length; i++) {
      const obj = this.vortexItems[i]
      gsap.to(obj.item.position, {
        x: "*= 1.5",
        z: "-=0.5",
        y: obj.item.name === "pedestal" ? "-=5" : "-=0",
        delay: obj.distance * 1.2,
        duration,
        ease: "power4.in",
      })

      gsap.to(obj.item.scale, {
        x: 0,
        y: 0,
        z: 0,

        delay: obj.distance * 1.5,
        duration,
        ease: "power3.in",
      })
    }

    gsap.delayedCall(duration * 2, () => {
      if (cb) cb()
    })
  }

  hideVortex(cb) {
    const duration = 0.6
    let longestDelay = 0

    SOUNDS.play("reform")

    for (let i = 0; i < this.vortexItems.length; i++) {
      const obj = this.vortexItems[i]
      const delay = Math.max(0, 0.4 - obj.distance * 0.5)

      longestDelay = Math.max(longestDelay, delay)
      const values = ["position", "rotation", "scale"]
      values.forEach((type) => {
        gsap.to(obj.item[type], {
          x: obj.item.home[type].x,
          y: obj.item.home[type].y,
          z: obj.item.home[type].z,
          delay,
          duration,
          ease: "power4.out",
        })
      })
    }

    gsap.delayedCall(duration + longestDelay, () => {
      this.items["sub-floor"].object.visible = true
      this.vortex.visible = false
      if (cb) cb()
    })
  }

  trapdoorEnter = () => {
    const tl = gsap.timeline()
    const item = this.items["trapdoor-door"]
    tl.to(item.object.rotation, { x: item.originalRotation.x - Math.PI * 0.5, ease: "power2.out", duration: 0.4 })
    tl.to(item.object.rotation, {
      onStart: () => {
        setTimeout(() => SOUNDS.play("trapdoor-close"), 300)
      },
      x: item.originalRotation.x,
      ease: "bounce",
      duration: 0.9,
    })
  }

  doorEnter = () => {
    const tl = gsap.timeline()
    const item = this.items["door-right"]
    tl.to(item.object.rotation, { z: item.originalRotation.z + Math.PI * 0.7, ease: "none", duration: 0.3 })
    tl.to(item.object.rotation, { z: item.originalRotation.z, ease: "elastic", duration: 2.5 })
  }

  add(item) {
    this.group.add(item)
  }

  pause() {
    this.paused = true
    this.skirt.visible = false
  }

  resume() {
    this.paused = false
    this.skirt.visible = true
  }

  tick(delta, elapsedTime) {
    this.vortexMaterial.uniforms.uTime.value += delta
  }
}
