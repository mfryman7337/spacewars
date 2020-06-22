#ifdef GL_ES
precision highp float;
#endif

#define STEP .9
#define KA 0.1
#define KD 1.5
#define PI 3.14159265
#define F_HEIGHT 5.0
#define F_RAD 0.75

uniform sampler2D texSampler;
uniform sampler2D mineSampler;
uniform sampler2D baseSampler;

uniform bool isOwned;
uniform bool highlight;
uniform bool mining;
uniform bool military;
uniform bool hover;

uniform vec3 light_pos;
uniform vec3 playerColor;
uniform float omega;

uniform float capacity;
uniform float deplete;

varying vec2 circle;

void main () {
    float rad = (circle.x * circle.x) + (circle.y * circle.y);
    vec2 texCoords = ((circle / 2.0) + .5);
    vec3 norm = vec3 (circle,  sqrt (1.0 - sqrt (circle.x * circle.x + circle.y * circle.y)));
    vec3 rnorm = vec3 (-(norm.z * cos (omega) - norm.x * sin (omega)), norm.x * cos (omega) + norm.z * sin (omega), norm.y);
     
    float lat = (atan (rnorm.z, length (rnorm.xy)) + PI / 2.0) / (PI);
    float lon = (atan (rnorm.x, rnorm.y) + PI) / (PI * 2.0);
    lat = clamp (lat, 0.0, 1.0);
    if (omega > PI && lon < .5)
        lon += 1.0;
    //else if (omega < 0.0 && omega > -PI && lon > .5)
        //lon -= 1.0;

    /*float alpha;
    float texLon;
    float altLon;
    if (lon < 1.0) {
        texLon = lon * .9 + .1;
	altLon = 1.0 + lon - .9;
	alpha = (lon - .9) / .1;
    }
    else if (lon >= 1.0) {
        texLon = lon * .9 + .2;	 
	altLon = 1.0 + lon - 1.0 - .9;
	alpha = (lon - 1.0 - .9) / .9;
    }*/
     
    vec3 texColor = texture2D (texSampler, vec2 (lon, lat)).xyz;
    /*if ((lon > .9 && lon < 1.0) || (lon > 1.9 && lon < 2.0)) {
	vec3 altTex = texture2D (texSampler, vec2 (altLon, lat)).xyz;
	texColor = texture2D (texSampler, vec2 (texLon, lat)).xyz * (1.0 - alpha) + altTex *alpha;
    }*/
    
    vec3 ambient = texColor * KA;
    float n = dot (norm, light_pos);
    vec3 diffuse = clamp (texColor * n * KD, 0.0, 1.0);
    
    gl_FragColor = vec4 (clamp (ambient + diffuse, 0.0, 1.0), 1.0);

    // Factor used to determine the intensity of the highlight.
    
    float factor = 1.0;
    if (highlight) {
        factor = 2.0;
    } else if (hover) {
        factor = 1.5;
    }

    // Decals

    if (mining) {
        // float g = (gl_FragColor.x + gl_FragColor.y + gl_FragColor.z) / 3.0;

        vec4 mine = texture2D (mineSampler, texCoords);
	if (circle.y > -deplete * 2.0 + 1.0) {
	    float g = (mine.x + mine.y + mine.z) / 3.0;	    
            mine.xyz = vec3 (g * 1.0, g * .55, g * .22);
	}
        gl_FragColor.xyz = (mine.w) * (mine.xyz) + (1.0 - mine.w) * gl_FragColor.xyz;
    /*if (length (circle) >= depletion) {

	}*/
    }
    else if (military) {
        vec4 military = texture2D (baseSampler, texCoords);
	if (circle.y > -capacity * 2.0 + 1.0) {
	    float g = (military.x + military.y + military.z) / 3.0;	    
            military.xyz = vec3 (.2 * g, 0.87 * g, .98 * g);
	}
        gl_FragColor.xyz = (military.w * 1.0) * (military.xyz) + (1.0 - military.w * 1.0) * gl_FragColor.xyz;
    }
    
    gl_FragColor.xyz = clamp (gl_FragColor.xyz * factor, 0.0, 1.0);
    
    // Outer highlight
    
    vec3 atmosphereColor = vec3(0.6, 0.65, 0.8);

    /*if (rad > .55 && rad < .85) {
        float delta = 1.0 - abs (.7 - rad) / .15;
	
        gl_FragColor.xyz = delta * vec3 (1.0, 0.0, 0.0) + (1.0 - delta) * gl_FragColor.xyz;
    }*/

    if (rad > 1.0) {
		float filter = F_HEIGHT * exp (-rad / pow (F_RAD, 2.0));
        // Use a dimmer highlight for uncolonized planets.
        // if (! isOwned) {
        //     filter = filter * 0.25;
        // }
        gl_FragColor = vec4 (atmosphereColor, filter);
        return;
    }

    // Inner highlight
    if (rad > STEP) {
        float filter = F_HEIGHT * exp (-rad / pow (F_RAD, 2.0));
        float alpha = clamp (1.0 - (rad - .9) / .1, 0.0, 1.0);
        float out_a = alpha + filter * (1.0 - alpha);
        gl_FragColor = vec4 (gl_FragColor.xyz * alpha + atmosphereColor * (1.0 - alpha) * filter / out_a, out_a);  
    }
}
