const float spriteSheetCount = 8.0;

uniform sampler2D spriteSheet;

varying float vLife;
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

    vec4 tex = getSprite(uv, floor(vRandom.y * spriteSheetCount));
   
    vec3 color = mix(tex.rgb, vec3(0.02, 0.0, 0.0), 0.8 + vRandom.x * 0.2 );
    float strength = tex.a * 1.0 ;

    if(strength < 0.0) strength = 0.0;
 
    float fade = 1.0;
    if(vLife < 0.6) {
        fade = smoothstep(0.0, 0.6, vLife);
    } else {
        fade = 1.0 - smoothstep(0.8, 1.0, vLife);
    }

    gl_FragColor = vec4(color, strength * fade);
}