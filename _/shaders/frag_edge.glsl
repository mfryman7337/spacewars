#ifdef GL_ES
precision highp float;
#endif

#define PI 3.14159265

uniform float deltaU;
uniform float colorFactorU;
uniform float alphaFactorU;
uniform float widthU;
uniform float f_radU;
uniform vec3 colorU;

uniform float colorFactorM;
uniform float alphaFactorM;
uniform float widthM;
uniform float f_radM;
uniform vec3 colorM;

uniform float deltaV;
uniform float colorFactorV;
uniform float alphaFactorV;
uniform float widthV;
uniform float f_radV;
uniform vec3 colorV;

uniform int fade;

varying vec2 dist;

void main () {
    //     gl_FragColor = vec4 (1.0, 1.0, 1.0, 1.0);
    //return;
    vec3 color;
    float filter;
    float colorFactor;
    float alphaFactor;     
    if (dist.x >= 1.0 - deltaU) {
        color = colorU;
        filter = widthU * exp (-abs (dist.y) / pow (f_radU, 2.0));	
        colorFactor = colorFactorU;
        alphaFactor = alphaFactorU;
    }
    else if (dist.x <= deltaV) {
        color = colorV;
        filter = widthV * exp (-abs (dist.y) / pow (f_radV, 2.0));	
        colorFactor = colorFactorV;
        alphaFactor = alphaFactorV;
    }
    else {
        color = colorM;
        filter = widthM * exp (-abs (dist.y) / pow (f_radM, 2.0));	
        colorFactor = colorFactorM;
        alphaFactor = alphaFactorM;
     }
     gl_FragColor = clamp (vec4 (color, alphaFactor * filter), 0.0, 1.0);
     if (fade == 1)
     	gl_FragColor.w *= (dist.x);
     else if (fade == -1)
     	gl_FragColor.w *= (1.0 - dist.x);
}