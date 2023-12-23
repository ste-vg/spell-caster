import { lerp } from "./misc"

export const lerpVectors = (start, end, amount) => {
  return {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
    z: start.z + (end.z - start.z) * amount,
  }
}

export const multiplyScalar = (vector, amount) => {
  return {
    x: vector.x * amount,
    y: vector.y * amount,
    z: vector.z * amount,
  }
}

export const divideScalar = (vector, amount) => {
  return multiplyScalar(vector, 1 / amount)
}

export const add = (a, b) => {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  }
}

export const normalize = (vector) => {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

export const clamp = (vector, min, max) => {
  vector.x = Math.max(min.x, Math.min(max.x, vector.x))
  vector.y = Math.max(min.y, Math.min(max.y, vector.y))
  vector.z = Math.max(min.z, Math.min(max.z, vector.z))

  return vector
}

export const length = (vector) => {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
}

export const clampLength = (vector, min, max) => {
  const l = length(vector)

  const divided = divideScalar(vector, l || 1)
  return multiplyScalar(divided, Math.max(min, Math.min(max, l)))
}
