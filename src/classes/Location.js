import {
  AxesHelper,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three"
import { randomFromArray } from "../utils"

import vertexShader from "../shaders/trail/vert.glsl"
import fragmentShader from "../shaders/trail/frag.glsl"
import { FragmentShader } from "../shaders/FragmentShader"

export class Location {
  #position
  #offset
  #index

  constructor(position, offset, entrances, releaseCallback, markerColor = 0xffffff) {
    this.#position = position
    this.rotation = position.r
    this.#offset = offset
    this.group = new Group()
    this.releaseCallback = releaseCallback
    this.markerColor = markerColor

    this.entranceOptions = entrances.map((e) => e.name)
    this.entrancePaths = {}

    this.energyEmitter = null

    this.init()

    this.createEntrancePaths(entrances)
  }

  init() {
    this.setPosition()
    if (window.DEBUG.locations) {
      const axesHelper = new AxesHelper(0.1)
      axesHelper.rotation.y = this.rotation
      this.group.add(axesHelper)
      const helper = new Mesh(new SphereGeometry(0.01), new MeshBasicMaterial({ color: this.markerColor }))
      this.group.add(helper)
    }
  }

  getRandomEntrance() {
    const entrance = randomFromArray(this.entranceOptions)
    return this.entrancePaths[entrance]
  }

  createEntranceTrail(curve) {
    const pointsCount = 200

    const frenetFrames = curve.computeFrenetFrames(pointsCount, false)
    const points = curve.getSpacedPoints(pointsCount)
    const width = [-0.05, 0.05]

    let point = new Vector3()
    let shift = new Vector3()

    let planePoints = []

    width.forEach((d) => {
      for (let i = 0; i < points.length; i++) {
        point = points[i]
        shift.add(frenetFrames.binormals[i]).multiplyScalar(d)
        planePoints.push(new Vector3().copy(point).add(shift))
      }
    })

    const geometry = new PlaneGeometry(0.1, 0.1, points.length - 1, 1).setFromPoints(planePoints)
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader: FragmentShader(fragmentShader),
      side: DoubleSide,
      transparent: true,
      uniforms: {
        progress: { value: 0.0 },
        debug: { value: window.DEBUG.trail },
      },
    })
    const plane = new Mesh(geometry, material)
    plane.scale.set(this.#offset.x, this.#offset.y, this.#offset.z)
    this.group.add(plane)
    plane.visible = false
    return plane
  }

  createEntrancePaths(entrances) {
    entrances.forEach((entrance) => {
      const curve = entrance.createPathTo(this.#position, this.#offset, true)
      const points = curve.getSpacedPoints(30)
      const trail = this.createEntranceTrail(curve)

      this.entrancePaths[entrance.name] = { points, curve, trail, entrance }

      if (window.DEBUG.locations) {
        const geometry = new TubeGeometry(curve, 50, 0.001, 8, false)
        const material = new MeshBasicMaterial({ color: this.markerColor })
        const curveObject = new Mesh(geometry, material)
        curveObject.scale.set(this.#offset.x, this.#offset.y, this.#offset.z)

        this.group.add(curveObject)
      }
    })
  }

  setPosition() {
    const p = {
      x: this.#position.x * this.#offset.x,
      y: this.#position.y * this.#offset.y,
      z: this.#position.z * this.#offset.z,
    }
    this.group.position.set(p.x, p.y, p.z)
  }

  add(item) {
    this.group.add(item)
  }

  release() {
    this.releaseCallback(this.#index)
  }

  get x() {
    return this.#position.x
  }

  get y() {
    return this.#position.y
  }

  get z() {
    return this.#position.z
  }

  get position() {
    return this.#position
  }

  set index(newIndex) {
    this.#index = newIndex
  }

  set position(newPosition) {
    this.#position = newPosition
    this.setPosition()
  }

  set x(newX) {
    this.#position.x = newX
    this.setPosition()
  }

  set y(newY) {
    this.#position.y = newY
    this.setPosition()
  }

  set z(newZ) {
    this.#position.z = newZ
    this.setPosition()
  }
}
