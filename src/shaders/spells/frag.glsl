#define PI 3.141592
#define PI_2 6.283185

uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress;
uniform vec3 uColor;
uniform float uSeed; 


varying vec2 vUv;

float noiseSize = 30.0 ;
float fadeLength = 3.0;

#include noise

float swipe(vec2 uv, float progress, float direction) {
    float x = ((PI_2 + (fadeLength * 2.0)) * progress) - fadeLength;
    float angle = (PI - atan(uv.y - 0.5, uv.x - 0.5));
    return smoothstep(x + fadeLength, x - fadeLength, angle * direction) * 0.5;
}

vec2 rotatedUV(float angle, vec2 uv) {
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    return rotationMatrix * uv;
}

vec4 sampleRotatedTexture(float angle, vec2 texCoord)
{
    // Translate texture coordinates to center
    vec2 centeredTexCoord = texCoord - vec2(0.5);

    // Create a 2x2 rotation matrix
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    // Apply rotation to centered texture coordinates
    vec2 rotatedTexCoord = rotatedUV(angle, centeredTexCoord);

    // Translate texture coordinates back to original position
    rotatedTexCoord += vec2(0.5);

    // Sample the texture
    return texture(uTexture, rotatedTexCoord);
}

void main()
{
    if(uProgress >= 1.0) discard;

    // float a = noise * shape.r;

    float left = uProgress * 1.0; 
    float right = -uProgress * 0.5;

    float leftNoise = step((snoise((vUv.xy + uSeed )* noiseSize) + 1.0) / 2.0, smoothstep(0.0, 0.9, uProgress));
    float rightNoise = step((snoise((vUv.xy + uSeed )* noiseSize) + 1.0) / 2.0, smoothstep(0.3, 0.9, uProgress));
    // Sample the texture twice with different rotations
    vec4 leftTex = sampleRotatedTexture(left, vUv);
    vec4 rightTex = texture(uTexture, vUv);

    
    float fade = 1.0 - smoothstep(0.7, 1.0, uProgress);
    fade *= smoothstep(0.0, 0.1, uProgress);

    float red = leftTex.r * leftNoise; //tex.r;
    float green = rightTex.g * rightNoise;
    float blue = rightTex.b;

    float alpha = min(1.0, red + green);
    vec3 color = mix(vec3(1.0), uColor, smoothstep(0.5, 0.7, uProgress));

    gl_FragColor = vec4(color * alpha,  alpha * fade);
    // gl_FragColor = vec4(vec3(rightNoise, 0.0 ,0.0), 1.0);
}