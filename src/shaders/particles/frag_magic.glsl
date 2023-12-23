#define wtf 0x5f3759df;

const float spriteSheetCount = 7.0;

uniform sampler2D spriteSheet;

varying float vLife;
varying float vType;
varying vec3 vColor;
varying vec3 vRandom;

vec4 getSprite(vec2 uv, float i) {
    float chunkSize = 1.0 / spriteSheetCount;
    return texture( spriteSheet, vec2((chunkSize * i) + uv.x * chunkSize, uv.y) );
}

void main()
{
    if(vLife <= 0.0) discard;

    vec2 uv = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y );
    vec4 tex =  getSprite(uv, vType);

    float strength = tex.r;

    // Diffuse point
    if(vType == 1.0) {
        if(vRandom.r >= 0.5) strength = tex.r;
        else strength = tex.g;
    }

    if(vType == 6.0) {       
        if(vRandom.r <= 0.33) strength = tex.r;
        else if(vRandom.r >= 0.66) strength = tex.g;
        else strength = tex.b;
    }

    vec3 color = mix(vColor, vec3(1.0), vRandom.x * 0.4 );

    float fade = 1.0;
    if(vLife < 0.5) {
        fade = smoothstep(0.0, 0.5, vLife);
    } else {
        fade = 1.0 - smoothstep(0.9, 1.0, vLife);
    }

    gl_FragColor = vec4(color, strength * fade);
}