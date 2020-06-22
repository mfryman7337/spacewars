uniform mat4 screen;
attribute vec4 pos;

varying vec2 circle;

attribute vec2 circle_in;

void main () {
     circle = circle_in;
     gl_Position = screen * pos;
}