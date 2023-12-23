/* 
  The demon needs a little moment to get loaded
	into memory. So rather than wait for the first
	in game enemy to appear and get hit with a 
	stutter, we use this preloader to do some 
	heavy lifting during the loading screen
*/

import { ASSETS } from "../Assets"
import noise from "../../shaders/shared/noise.glsl"

export class EnemyPreloader {
  constructor(stage) {
    this.totalDemons = 6
    this.demons = []

    for (let i = 0; i < this.totalDemons; i++) {
      this.demons.push({
        isAvailable: true,
        returnToPool: function () {
          this.isAvailable = true
        },
        uniforms: {
          in: { value: 0 },
          out: { value: 0 },
          stretch: { value: 0 },
          time: { value: 1 },
          freeze: { value: 0 },
        },
        demon: ASSETS.getModel("demon", true),
      })
    }

    this.demons.forEach((enemy, i) => {
      enemy.demon.group.position.y = -0.1
      enemy.demon.group.position.x = 0.05 + 0.02 * (i + 1)
      stage.add(enemy.demon.group)
      enemy.demon.scene.traverse((item) => {
        if (item.name === "cloak") {
          item.material.onBeforeCompile = (shader) => {
            shader.uniforms.uIn = enemy.uniforms.in
            shader.uniforms.uOut = enemy.uniforms.out
            shader.uniforms.uStretch = enemy.uniforms.stretch
            shader.uniforms.uTime = enemy.uniforms.time
            shader.uniforms.uFreeze = enemy.uniforms.freeze

            shader.vertexShader = shader.vertexShader.replace(
              "#define STANDARD",
              `#define STANDARD
							
							${noise}
							uniform float uOut;
							uniform float uTime;
							uniform float uStretch;
              uniform float uFreeze;
							varying vec2 vUv;
							varying float vNoise;
							`
            )

            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              `
									#include <begin_vertex>
					
									vUv = uv;
									float xNoise = snoise(vec2((position.x * 200.0) + (position.z * 100.0), uTime * (0.6 + (0.3 * uOut))));
									float yNoise = snoise(vec2((position.y * 200.0) + (position.z * 100.0), uTime * (0.6 + (0.3 * uOut))));
									float amount = (0.0015 + 0.02 * uOut) ;

                  float moveAmount = smoothstep(0.02 + (1.0 * uOut), 0.0, position.y) * (1.0 - uFreeze);

									transformed.x += moveAmount * amount * xNoise;
									transformed.y += moveAmount * amount * yNoise;

									transformed.x = transformed.x * (1.0 - uOut);
									transformed.y = transformed.y * (1.0 - uOut)+ (0.0 * uOut);
									transformed.z = transformed.z * (1.0 - uOut);

                  transformed.y -= (moveAmount * uStretch) * 0.01;
                  transformed.x += (moveAmount * uStretch) * 0.003;
									
									vNoise = snoise(vec2(position.x * 500.0, position.y * 500.0 ));
							`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <common>",
              `
            		uniform float uIn;
            		uniform float uOut;
            		uniform float uTime;
                uniform float uFreeze;
            		varying vec2 vUv;
            		varying float vNoise;

								${noise}

            		#include <common>
            `
            )
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <output_fragment>",
              `#include <output_fragment>

              // float noise = snoise(vUv);

              // vec3 blackout = mix(vec3(vUv, 1.0), gl_FragColor.rgb, uOut);
							float noise = snoise(vUv * 80.0);

							float glowNoise = snoise((vUv * 4.0) + (uTime * 0.75)) ;
							float glow = smoothstep(0.3, 0.5, glowNoise);
							glow *= smoothstep(0.7, 0.5, glowNoise);
							// glowNoise = smoothstep(0.7, 0.5, glowNoise);

							float grad =  smoothstep(0.925 + (uOut * 0.2), 1.0, vUv.y) * noise;
							


              // gl_FragColor = vec4(vec3(grad, 0.0, 0.0), 1.0 - grad);
              // gl_FragColor.a = 1.0 - grad;
              gl_FragColor.rgb *= 1.0 - grad;
              gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0), glow * 0.2 * pow(uOut, 0.25) + (uFreeze * 0.3) )  ;
							
            `
            )

            enemy.demon.group.removeFromParent()
          }
        }
      })
    })
  }

  resetAll() {
    this.demons.forEach((d) => (d.isAvailable = true))
  }

  borrowDemon() {
    const availableDemons = this.demons.filter((d) => d.isAvailable)

    const demon = availableDemons[0]
    demon.isAvailable = false
    return demon
  }
}
