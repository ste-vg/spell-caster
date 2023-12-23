import { createNoise3D } from "simplex-noise"
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  OneFactor,
  Points,
  ShaderMaterial,
  Vector3,
  ZeroFactor,
} from "three"
import { AXIS, PARTICLE_STYLES } from "../consts"

import vertexShader from "../shaders/particles/vert.glsl"
import fragmentShaderMagic from "../shaders/particles/frag_magic.glsl"
import fragmentShaderSmoke from "../shaders/particles/frag_smoke.glsl"
import { vector } from "../utils"
import { ASSETS } from "./Assets"

const noise3D = createNoise3D()

const DEFAULT_PARTICLE_MATERIAL_SETTINGS = {
  depthWrite: false,
  vertexColors: true,
  vertexShader,
}

const PROPERTIES = {
  vec3: ["position", "direction", "random", "color"],
  float: ["type", "speed", "speedDecay", "force", "forceDecay", "acceleration", "life", "lifeDecay", "size"],
}
export class ParticleSim {
  constructor(settings) {
    this.settings = {
      size: { x: 11, y: 5, z: 12 },
      particles: 5000,
      noiseStrength: 0.8,
      flowStrength: 0.03,
      pixelRatio: 1,
      gridFlowDistance: 1,
      flowDecay: 0.95,
      ...settings,
    }

    this._size = new Vector3(this.settings.size.x, this.settings.size.y, this.settings.size.z)
    const max = Math.max(...this._size.toArray())
    this._size.divideScalar(max)

    this.gridCellCount = this.settings.size.x * this.settings.size.y * this.settings.size.z

    this._grid = new Float32Array(this.gridCellCount * 3)
    this._flow = new Float32Array(this.gridCellCount * 3)
    this._noise = new Float32Array(this.gridCellCount * 3)

    this.offset = new Vector3(
      (this.size.x / this.grid.x) * 0.5,
      (this.size.y / this.grid.y) * 0.5,
      (this.size.z / this.grid.z) * 0.5
    )

    this.startCoords = new Vector3(
      0 - this.offset.x * this.settings.size.x,
      0 - this.offset.y * this.settings.size.y,
      0 - this.offset.z * this.settings.size.z
    )

    this.particleGroups = {
      smoke: {
        count: 1000,
        nextParticle: 0,
        newParticles: false,
        geometry: new BufferGeometry(),
        material: new ShaderMaterial({
          ...DEFAULT_PARTICLE_MATERIAL_SETTINGS,
          fragmentShader: fragmentShaderSmoke,
          blending: CustomBlending,
          blendDstAlpha: OneFactor,
          blendSrcAlpha: ZeroFactor,
          uniforms: {
            uTime: { value: 0 },
            uGrow: { value: true },
            uSize: { value: 250 * this.settings.pixelRatio },
            spriteSheet: { value: ASSETS.getTexture("smoke-particles") },
          },
        }),
        mesh: null,
        properties: {},
      },
      magic: {
        count: 4000,
        nextParticle: 0,
        newParticles: false,
        geometry: new BufferGeometry(),
        material: new ShaderMaterial({
          ...DEFAULT_PARTICLE_MATERIAL_SETTINGS,
          fragmentShader: fragmentShaderMagic,
          blending: AdditiveBlending,
          uniforms: {
            uGrow: { value: false },
            uTime: { value: 0 },
            uSize: { value: 75 * this.settings.pixelRatio },
            spriteSheet: { value: ASSETS.getTexture("magic-particles") },
          },
        }),
        mesh: null,
        properties: {},
      },
    }

    this.particleGroupsArray = Object.keys(this.particleGroups).map((key) => this.particleGroups[key])

    this.particleGroupsArray.forEach((group) => {
      group.mesh = new Points(group.geometry, group.material)
      group.mesh.frustumCulled = false

      // group.mesh.renderOrder = 10000

      PROPERTIES.vec3.forEach((propertyName) => {
        group.properties[propertyName] = new Float32Array(group.count * 3)
      })

      PROPERTIES.float.forEach((propertyName) => {
        group.properties[propertyName] = new Float32Array(group.count)
      })

      group.mesh.position.x -= this.offset.x * this.settings.size.x
      group.mesh.position.y -= this.offset.y * this.settings.size.y
      group.mesh.position.z -= this.offset.z * this.settings.size.z

      group.mesh.scale.set(this._size.x, this._size.y, this._size.z)
      group.mesh.renderOrder = 1

      group.geometry.setAttribute("position", new BufferAttribute(group.properties.position, 3))
      group.geometry.setAttribute("color", new BufferAttribute(group.properties.color, 3))
      group.geometry.setAttribute("scale", new BufferAttribute(group.properties.size, 1))
      group.geometry.setAttribute("life", new BufferAttribute(group.properties.life, 1))
      group.geometry.setAttribute("type", new BufferAttribute(group.properties.type, 1))
      group.geometry.setAttribute("random", new BufferAttribute(group.properties.random, 3))
    })

    this.castParticles = []

    this.init()
  }

  init() {
    for (let i = 0; i < this._grid.length; i += 3) {
      this._grid[i] = Math.random() * 2 - 1
      this._grid[i + 1] = Math.random() * 2 - 1
      this._grid[i + 2] = Math.random() * 2 - 1
    }

    Object.keys(this.particleGroups).forEach((key) => {
      const group = this.particleGroups[key]
      for (let i = 0; i < group.count; i++) {
        this.createParticle(key)
      }

      for (let i = 0; i < group.properties.random.length; i++) {
        group.properties.random[i] = Math.random()
      }
    })

    this.gridFlowLookup = this.setupGridFlowLookup()
  }

  setupGridFlowLookup() {
    let lookupArray = []
    const d = this.settings.gridFlowDistance

    for (let z = 0; z < this.settings.size.z; z++) {
      for (let y = 0; y < this.settings.size.y; y++) {
        for (let x = 0; x < this.settings.size.x; x++) {
          const position = { x, y, z } //new Vector3(x, y, z)
          let group = []

          for (let _z = position.z - d; _z <= position.z + d; _z++) {
            for (let _y = position.y - d; _y <= position.y + d; _y++) {
              for (let _x = position.x - d; _x <= position.x + d; _x++) {
                const newPosition = { x: _x, y: _y, z: _z }
                if (this.validGridPosition(newPosition)) {
                  group.push(this.getGridIndexFromPosition(newPosition))
                }
              }
            }
          }
          lookupArray.push(group)
        }
      }
    }

    return lookupArray
  }

  getVectorFromArray(array, index) {
    if (typeof array === "string") array = this["_" + array]

    if (array)
      return {
        x: array[index * 3],
        y: array[index * 3 + 1],
        z: array[index * 3 + 2],
      }
    return null
  }

  getGridSpaceFromPosition(position) {
    const gridSpace = {
      x: Math.floor(position.x * this.settings.size.x),
      y: Math.floor(position.y * this.settings.size.y),
      z: Math.floor(position.z * this.settings.size.z),
    }

    return gridSpace
  }

  updateArrayFromVector(array, index, vector) {
    if (typeof array === "string") array = this["_" + array]
    if (array) {
      array[index * 3] = vector.x !== undefined ? vector.x : vector.r
      array[index * 3 + 1] = vector.y !== undefined ? vector.y : vector.g
      array[index * 3 + 2] = vector.z !== undefined ? vector.z : vector.b
    } else {
      console.logLimited("invalid array")
    }
  }

  getGridIndexFromPosition(position) {
    let index = position.x
    index += position.y * this.settings.size.x
    index += position.z * this.settings.size.x * this.settings.size.y

    return index
  }

  validGridPosition(position) {
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      return false
    }

    if (position.x < 0 || position.y < 0 || position.z < 0) {
      return false
    }

    if (
      position.x >= this.settings.size.x ||
      position.y >= this.settings.size.y ||
      position.z >= this.settings.size.z
    ) {
      return false
    }

    return true
  }

  getGridSpaceDirection(position, source = "grid") {
    if (!this.validGridPosition(position)) {
      return null
    }

    let index = this.getGridIndexFromPosition(position)

    const direction = this.getVectorFromArray(this[`_${source}`], index)

    return direction
  }

  getSurroundingGrid(index) {
    const surrounding = this.gridFlowLookup[index]

    const toReturn = []
    for (let i = 0; i < surrounding.length; i++) {
      const j = surrounding[i]
      const direction = { x: this._grid[j * 3], y: this._grid[j * 3 + 1], z: this._grid[j * 3 + 2] }
      toReturn.push({
        x: direction.x,
        y: direction.y,
        z: direction.z,
      })
    }

    return toReturn
  }

  getGridCoordsFromIndex(index) {
    const z = Math.floor(index / (this.settings.size.z * this.settings.size.y))
    const y = Math.floor((index - z * this.settings.size.x * this.settings.size.y) / this.settings.size.x)
    const x = index % this.settings.size.x

    return { x, y, z }
  }

  step(delta, elapsedTime) {
    for (let i = 0; i < this.gridCellCount; i++) {
      const coords = this.getGridCoordsFromIndex(i)

      const t = elapsedTime * 0.05

      const nc = {
        x: coords.x * 0.05 + t,
        y: coords.y * 0.05 + t,
        z: coords.z * 0.05 + t,
      }

      const noiseX = noise3D(nc.x, nc.y, nc.z)
      const noiseY = noise3D(nc.y, nc.z, nc.x)
      const noiseZ = noise3D(nc.z, nc.x, nc.y)

      const noise = vector.normalize({
        x: Math.cos(noiseX * Math.PI * 2),
        y: Math.sin(noiseY * Math.PI * 2),
        z: Math.cos(noiseZ * Math.PI * 2),
      })

      const surroundingPositions = this.getSurroundingGrid(i)
      const sum = vector.multiplyScalar(noise, this.settings.noiseStrength)

      for (let j = 0; j < surroundingPositions.length; j++) {
        const direction = surroundingPositions[j]

        sum.x += direction.x
        sum.y += direction.y
        sum.z += direction.z
      }

      const average = {
        x: sum.x / surroundingPositions.length,
        y: sum.y / surroundingPositions.length,
        z: sum.z / surroundingPositions.length,
      }

      this.updateArrayFromVector("flow", i, average)
      this.updateArrayFromVector("noise", i, noise)
    }

    for (let i = 0; i < this._grid.length; i++) {
      this._grid[i] += this._flow[i] * this.settings.flowStrength
    }

    this.particleGroupsArray.map((group) => {
      const { life, lifeDecay, position, direction, force, forceDecay, speed, speedDecay, acceleration } =
        group.properties

      for (let i = 0; i < group.count; i++) {
        if (life[i] > 0) {
          let particlePosition = this.getVectorFromArray(position, i)
          let particleDirection = this.getVectorFromArray(direction, i)
          const gridSpace = this.getGridSpaceFromPosition(particlePosition)
          let gridDirection = this.getGridSpaceDirection(gridSpace)

          if (gridDirection) {
            particleDirection = vector.lerpVectors(
              particleDirection,
              vector.normalize(gridDirection),
              1 - Math.max(0, Math.min(1, force[i]))
            )
          }

          const move = vector.multiplyScalar(particleDirection, delta ? delta * speed[i] : 0.01)

          particlePosition = vector.add(particlePosition, move)

          AXIS.forEach((xyz) => {
            if (particlePosition[xyz] < 0 || particlePosition[xyz] > 1) {
              particlePosition[xyz] = particlePosition[xyz] < 0 ? 0 : 1
              particleDirection[xyz] *= -1
            }
          })

          this.updateArrayFromVector(position, i, particlePosition)
          this.updateArrayFromVector(direction, i, vector.normalize(particleDirection))

          const gridIndex = this.getGridIndexFromPosition(gridSpace)
          if (gridDirection) {
            const newGridDirection = vector.add(
              gridDirection,
              vector.multiplyScalar(particleDirection, force[i] * 0.05)
            )

            this.updateArrayFromVector("grid", gridIndex, newGridDirection)
            speed[i] += vector.length(newGridDirection) * acceleration[i] * delta
            if (speed[i] > 1) speed[i] = 1
          }

          speed[i] -= speedDecay[i] * delta
          force[i] -= forceDecay[i] * delta
          life[i] -= lifeDecay[i] * delta
          if (speed[i] < 0.015) speed[i] = 0.015
          if (force[i] < 0) force[i] = 0
          if (life[i] < 0) life[i] = 0
        }
      }

      group.material.uniforms.uTime.value = elapsedTime

      group.geometry.attributes.position.needsUpdate = true
      group.geometry.attributes.life.needsUpdate = true

      if (group.newParticles) {
        group.geometry.attributes.scale.needsUpdate = true
        group.geometry.attributes.color.needsUpdate = true
        group.geometry.attributes.type.needsUpdate = true
        group.newParticles = false
      }
    })

    for (let i = 0; i < this._grid.length; i++) {
      this._grid[i] *= this.settings.flowDecay
    }
  }

  getRandomPosition() {
    return {
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
    }
  }

  getRandomDirection() {
    return {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
    }
  }

  createParticle(groupID, settings) {
    const defaults = {
      color: { r: 1, g: 1, b: 1 },
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 0 },
      speed: 0,
      speedDecay: 0.6,
      force: 0,
      forceDecay: 0.1,
      life: 0,
      lifeDecay: 0.6,
      scale: 0.1,
      style: PARTICLE_STYLES.soft,
      acceleration: 0.1,
      casted: false,
    }

    const particleSettings = {
      ...defaults,
      ...settings,
    }

    const group = this.particleGroups[groupID]

    if (particleSettings.casted) this.castParticles.push(group.nextParticle)

    const {
      position,
      direction,
      color,
      speed,
      speedDecay,
      force,
      forceDecay,
      life,
      lifeDecay,
      size,
      type,
      acceleration,
    } = group.properties

    this.updateArrayFromVector(position, group.nextParticle, particleSettings.position)
    this.updateArrayFromVector(direction, group.nextParticle, particleSettings.direction)
    this.updateArrayFromVector(color, group.nextParticle, particleSettings.color)
    speed[group.nextParticle] = particleSettings.speed
    speedDecay[group.nextParticle] = particleSettings.speedDecay
    force[group.nextParticle] = particleSettings.force
    forceDecay[group.nextParticle] = particleSettings.forceDecay
    life[group.nextParticle] = particleSettings.life
    lifeDecay[group.nextParticle] = particleSettings.lifeDecay
    size[group.nextParticle] = particleSettings.scale
    type[group.nextParticle] = particleSettings.style
    acceleration[group.nextParticle] = particleSettings.acceleration

    const createdParticleIndex = group.nextParticle
    group.nextParticle++
    group.newParticles = true

    if (group.nextParticle >= group.count) group.nextParticle = 0

    return createdParticleIndex
  }

  getParticles(groupID) {
    const group = this.particleGroups[groupID]
    if (!group) return null
    return group.mesh
  }

  getParticlesProperties(groupID, prop) {
    const group = this.particleGroups[groupID]
    if (!group) return null
    return group.properties[prop]
  }

  setParticleProperty(group, index, property, value) {
    const properies = this.particleGroups[group].properties
    const vectors = ["position", "direction", "color"]
    if (vectors.indexOf(property) >= 0) this.updateArrayFromVector(properies[property], index, value)
    else properies[property][index] = value
  }

  get grid() {
    return { ...this.settings.size, points: this._grid.length / 3 }
  }

  get size() {
    return this._size
  }

  get particleMeshes() {
    return this.particleGroupsArray.map((group) => group.mesh)
  }
}
