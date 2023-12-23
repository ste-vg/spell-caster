import noise from "../shaders/shared/noise.glsl"

const includes = {
  noise,
}

function FragmentShader(shader) {
  const importTypes = Object.keys(includes)

  importTypes.forEach((type) => {
    shader = shader.replace(`#include ${type}`, includes[type])
  })

  return shader
}

export { FragmentShader }
