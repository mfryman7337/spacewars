uniform mat4 screen;

attribute vec4 pos;
attribute vec2 dist_in;

varying vec2 dist;

void main () {
     dist = dist_in;
     gl_Position = screen * pos;
}