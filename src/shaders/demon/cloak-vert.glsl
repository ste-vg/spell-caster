

uniform float uSize;
uniform float uTime;

varying vec2 vUv;

#include noise

void main()
{
    vUv = uv;


    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}