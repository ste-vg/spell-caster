import { gsap } from "gsap"
import {
  AmbientLight,
  Color,
  ColorManagement,
  DirectionalLight,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  ReinhardToneMapping,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three"

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import vertexShader from "../shaders/fade/vert.glsl"
import fragmentShader from "../shaders/fade/frag.glsl"

export class Stage {
  constructor(mount) {
    this.container = mount

    this.scene = new Scene()
    this.scene.background = new Color("#000000")

    this.group = new Group()
    this.scene.add(this.group)
    this.paused = false

    const overlayGeometry = new PlaneGeometry(2, 2, 1, 1)
    this.overlayMaterial = new ShaderMaterial({
      transparent: true,
      vertexShader,
      fragmentShader,
      uniforms: {
        uAlpha: { value: 1 },
      },
    })
    this.overlay = new Mesh(overlayGeometry, this.overlayMaterial)
    this.scene.add(this.overlay)

    this.size = {
      width: 1,
      height: 1,
    }

    ColorManagement.enabled = false

    this.cameraPositions = {
      playing: { x: 0, y: 0.3, z: 1.3 },
      overhead: { x: 0, y: 2, z: 0 },
      paused: { x: 0, y: 0.6, z: 1.6 },
      crystalOffset: { x: 0, y: 0.02, z: 0.2 },
      crystalIntro: { x: 0, y: 0.02, z: 0.3 },
      demon: { x: 0.05, y: -0.1, z: 0.3 },
      crystal: { x: 0, y: 0.02, z: 0.3 },
      bookshelf: { x: 0, y: 0, z: 0.2 },
      spellLesson: { x: 0.1, y: 0.3, z: 1.2 },
      vortex: { x: 0, y: 0.7, z: 1.3 },
      win: { x: 0, y: 0.02, z: 0.3 },
    }

    this.cameraLookAts = {
      playing: { x: 0, y: -0.12, z: 0 },
      overhead: { x: 0, y: -0.12, z: 0 },
      paused: { x: 0, y: -0.12, z: 0 },
      crystalOffset: { x: 0.05, y: -0.065, z: 0 },
      crystalIntro: { x: 0, y: -0.1, z: 0 },
      demon: { x: -0.2, y: -0.1, z: -0.2 },
      crystal: { x: 0, y: -0.065, z: 0 },
      bookshelf: { x: -0.3, y: -0.07, z: -0.15 },
      spellLesson: { x: 0.15, y: -0.12, z: 0 },
      vortex: { x: 0, y: -0.12, z: 0 },
      win: { x: 0, y: -0.1, z: 0 },
    }

    this.defaultCameraPosition = "crystalOffset"

    this.setupCamera()
    this.setupRenderer()
    this.setupLights()
    this.setupOrbitControls()
    this.onResize()
    this.render()
  }

  setupRenderPasses() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.setSize(this.size.width, this.size.height)
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    const ssaoPass = new SSAOPass(this.scene, this.camera, this.size.width, this.size.height)
    this.composer.addPass(ssaoPass)

    this.gui
      .add(ssaoPass, "output", {
        Default: SSAOPass.OUTPUT.Default,
        "SSAO Only": SSAOPass.OUTPUT.SSAO,
        "SSAO Only + Blur": SSAOPass.OUTPUT.Blur,
        Depth: SSAOPass.OUTPUT.Depth,
        Normal: SSAOPass.OUTPUT.Normal,
      })
      .onChange(function (value) {
        ssaoPass.output = value
      })

    this.gui.add(ssaoPass, "kernelRadius").min(0).max(32)
    this.gui.add(ssaoPass, "minDistance").min(0.001).max(0.02)
    this.gui.add(ssaoPass, "maxDistance").min(0.01).max(0.3)
    this.gui.add(ssaoPass, "enabled")
  }

  setupCamera() {
    const lookat = this.cameraLookAts[this.defaultCameraPosition]
    this.lookAt = new Vector3(lookat.x, lookat.y, lookat.z)
    this.camera = new PerspectiveCamera(35, this.size.width / this.size.height, 0.1, 3)

    this.camera.position.set(
      this.cameraPositions[this.defaultCameraPosition].x,
      this.cameraPositions[this.defaultCameraPosition].y,
      this.cameraPositions[this.defaultCameraPosition].z
    )
    this.camera.home = {
      position: { ...this.camera.position },
    }

    this.scene.add(this.camera)
  }

  reveal() {
    gsap.to(this.overlayMaterial.uniforms.uAlpha, {
      value: 0,
      duration: 2,
      onComplete: () => {
        this.overlay.visible = false
      },
    })
  }

  setupOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.controls.enabled = false
  }

  moveCamera(state, cb) {
    if (this.cameraPositions[state] && this.cameraLookAts[state]) {
      gsap.killTweensOf(this.camera.position)
      gsap.killTweensOf(this.lookAt)

      gsap.to(this.camera.position, {
        ...this.cameraPositions[state],
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
          if (cb) cb()
        },
      })
      gsap.to(this.lookAt, { ...this.cameraLookAts[state], duration: 2, ease: "power2.inOut" })
    }
  }

  resetCamera() {
    this.moveCamera(this.defaultCameraPosition)
  }

  setupRenderer() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })

    this.renderer.outputColorSpace = LinearSRGBColorSpace
    this.renderer.toneMapping = ReinhardToneMapping
    this.renderer.toneMappingExposure = 8

    this.container.appendChild(this.renderer.domElement)
  }

  setupLights() {
    this.scene.add(new AmbientLight(0xffffff, 0.1))

    const light = new DirectionalLight(0xfcc088, 0.1)
    light.position.set(0, 3, -2)
    this.scene.add(light)
  }

  onResize() {
    this.size.width = this.container.clientWidth
    this.size.height = this.container.clientHeight

    this.camera.aspect = this.size.width / this.size.height

    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.size.width, this.size.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    if (this.composer) {
      this.composer.setSize(this.size.width, this.size.height)
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
  }

  compile() {
    this.renderer.compile(this.scene, this.camera)
  }

  render() {
    if (!this.paused || !window.DEBUG.allowLookAtMoveWhenPaused) {
      this.camera.lookAt(this.lookAt)
      this.controls.target.x = this.lookAt.x
      this.controls.target.y = this.lookAt.y
      this.controls.target.z = this.lookAt.z
    }
    this.controls.update()

    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
  }

  add(element) {
    this.group.add(element)
  }

  destroy() {
    this.container.removeChild(this.renderer.domElement)
    window.removeEventListener("resize", this.onResize)
  }

  get everything() {
    return this.group
  }

  set defaultCamera(state) {
    console.log(state, this.cameraPositions[state])
    if (this.cameraPositions[state]) {
      this.defaultCameraPosition = state
      this.resetCamera()
    }
  }

  set useOrbitControls(enabled) {
    this.controls.enabled = enabled
  }
}
