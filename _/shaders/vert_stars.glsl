attribute vec2 pos;
attribute vec2 tex;
attribute vec2 fog;

varying vec2 texCoords;

uniform vec4 camera;
varying vec2 fogCoords;

void main () {
     texCoords = (tex + camera.xy / 5000.0);
     fogCoords = fog;
     gl_Position = vec4 (pos, 0.0, 1.0);
}