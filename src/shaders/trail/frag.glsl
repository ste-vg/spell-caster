uniform float progress;
uniform bool debug;

varying vec2 vUv;

#include noise

void main() {

    float length = 0.2;  

    float strength = 1.0;
    float xRange = 1.0 + length * 2.0;
    strength *= 1.0 - smoothstep(vUv.x - length * 0.5, xRange * progress, xRange * progress - length * 0.5);
    // strength *= step(xRange * progress, vUv.x + length * 0.5 );

    float noiseSmooth = (snoise(vec2((vUv.x) * 5.0, (vUv.y) * 3.0)) + 1.0) / 2.0;
    float noiseStepped = step(0.5, noiseSmooth);

    float debugColor = 0.0;
    if(debug) debugColor = 1.0;

    gl_FragColor.rgb = vec3(0.05 + debugColor * (1.0 - noiseSmooth), 0.05, 0.05);
    gl_FragColor.a = debugColor + strength * noiseSmooth;
}