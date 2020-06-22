var star_shader = null;

function Stars (engine) {
    var init = function () {
    star_shader = makeProgram (engine.gl, '_/shaders/vert_stars.glsl', '_/shaders/frag_stars.glsl');
    }

    if (!star_shader)
	init ();

    var square = [
		  -1.0, -1.0,
		  -1.0, 1.0,
		  1.0, -1.0,

		  -1.0, 1.0,
		  1.0, 1.0,
		  1.0, -1.0
		  ];
    var star_buffer = glBuffer (engine.gl, square, 2, 6);

    var lb = engine.camera.project (new vect (-1, -1));
    var lt = engine.camera.project (new vect (-1, 1));
    var rt = engine.camera.project (new vect (1, 1));
    var rb = engine.camera.project (new vect (1, -1));

    var w = engine.canvas.width () / 512;
    var h = engine.canvas.height () / 512;

    var coords = [
		  0.0, 0.0,
		  0.0, h,
		  w, 0.0,

		  0.0, h,
		  w, h,
		  w, 0.0
		  ];

    var fog = [
		  0.0, 0.0,
		  0.0, 1.0,
		  1.0, 0.0,

		  0.0, 1.0,
		  1.0, 1.0,
		  1.0, 0.0
		  ];

    var tex_buffer = glBuffer (engine.gl, coords, 2, 6);
    var fog_buffer = glBuffer (engine.gl, fog, 2, 6);

    var tex = getTexture ('_/tex/stars.png');

    this.draw = function (gl, test) {
	gl.useProgram(star_shader);

	star_shader.data ('pos', star_buffer);

	star_shader.data ('tex', tex_buffer);
	star_shader.data ('fog', fog_buffer);

	if (test) {
	    star_shader.data ('texSampler', test);
	    star_shader.data ('mask', true);
	}
	else
	    star_shader.data ('mask', false);
	star_shader.data ('starSampler', tex);

	star_shader.data ('camera', engine.camera.pos_array ());

	gl.drawArrays (gl.TRIANGLES, 0, star_buffer.numItems); 
    };
};