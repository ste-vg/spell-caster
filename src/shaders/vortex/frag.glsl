uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;

#include noise




void main() {

		// float fade = smoothstep(0.6, 1.0, 1.0 - vUv.y) ;
		float fade =  vUv.y ;
		float noise = snoise(vec2(vUv.x + vUv.y + uTime * 0.2, vUv.y - uTime * 0.5) * 6.0) ;
		noise = 0.2 + smoothstep(0.0, 2.0, noise + 1.0) * 0.8;
		float fineNoise = snoise(vec2(vUv.x, vUv.y * uTime)) ;
    gl_FragColor = vec4(vec3(fineNoise * 0.8, 1.0, fineNoise * 0.8) * noise * fade, 1.0);
}
