#ifdef GL_ES
precision highp float;
#endif

varying vec2 circle;

#define STEP .5

void main () {
    float rad = length (circle);
    if (rad > 1.0) 
        gl_FragColor = vec4 (0.0, 0.0, 0.0, 0.0);
	//        discard;
    else if (rad > STEP)
        gl_FragColor = vec4 (1.0, 1.0, 1.0, clamp ((1.0 - rad) / (1.0 - STEP), 0.0, 1.0));
    else    
        gl_FragColor = vec4 (1.0, 1.0, 1.0, 1.0);
}