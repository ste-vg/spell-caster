uniform float progress;
uniform bool debug;

varying vec2 vUv;

// #include noise

void main() {

    
    float alpha = (1.0 - smoothstep(0.3, 1.0, vUv.x));
    gl_FragColor.rgb = vec3(1.0, 1.0, 1.0);
    gl_FragColor.a = alpha;
}