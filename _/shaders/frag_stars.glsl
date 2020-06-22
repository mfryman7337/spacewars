#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D texSampler;
uniform sampler2D starSampler;

uniform bool mask;

varying vec2 texCoords;
varying vec2 fogCoords;

void main () {
     if (!mask)
         gl_FragColor = texture2D (starSampler, texCoords);
     else {
         float fog = 1.0 - texture2D (texSampler, fogCoords).w;
         gl_FragColor = texture2D (starSampler, texCoords);
	 gl_FragColor.w = fog;
     }
}