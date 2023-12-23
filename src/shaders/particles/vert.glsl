
uniform float uSize;
uniform float uTime;
uniform bool uGrow;

attribute float scale;
attribute float life;
attribute float type;
attribute vec3 random;

varying vec3 vColor;
varying float vLife;
varying float vType;
varying vec3 vRandom;


void main()
{
    /**
     * Position
     */
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    float spiralRadius = 0.1;
    // projectedPosition = projectedPosition + vec4(cos(uTime * random.x) * spiralRadius, sin(uTime * random.y) * spiralRadius, 0.0, 0.0);
    gl_Position = projectedPosition;

    

    vColor = color;
    vRandom = random;
    vLife = life;
    vType = type;

    /**
     * Size
     */
    if(uGrow) {
      gl_PointSize = uSize * scale * (2.5 - life);
    }
    else {
      gl_PointSize = uSize * scale * life;
    }
    
    gl_PointSize *= (1.0 / - viewPosition.z);
}