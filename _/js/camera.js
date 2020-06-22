function Camera (canvas) {
    screenMatrix = [
        1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		0.0, 0.0, 0.0, 1.0
    ];

    this.position = new vect (0.0, 0.0);

    this.scale = 1.0;

    var matrix = new Float32Array (screenMatrix);

    matrix[0] = this.scale * 2.0 / canvas.width ();
    matrix[5] = this.scale * 2.0 / canvas.height ();
    matrix[12] = 0.0;
    matrix[13] = 0.0;

    var pos = new Float32Array ([0.0, 0.0, 0.0, 1.0]);

    this.zoom = function (x) {
        this.scale = x;
		if (this.scale < 0.35) {
			this.scale = 0.35;
		} else if (this.scale > 2) {
			this.scale = 2;
		}
        matrix[0] = this.scale * 2.0 / canvas.width ();
        matrix[5] = this.scale * 2.0 / canvas.height ();
    };
	
    this.glMatrix = function () {
	matrix[12] = - this.position.x * matrix[0];
	matrix[13] = - this.position.y * matrix[5];
	return matrix;
    };

    this.project = function (v) {
	return new vect (
	    v.x / matrix[0] + this.position.x,
	    v.y / matrix[5] + this.position.y)
    };
    
    this.screen = function (v) {
	var result = new vect (
	    v.x * matrix[0] - this.position.x * matrix[0],
	    v.y * matrix[5] - this.position.y * matrix[5]);
	result.add (new vect (1.0, 1.0))
	result.scale (.5);
	result.y = 1.0 - result.y
	result.x *= canvas.width ();
	result.y *= canvas.height ();
	return result;
    };

    this.pos_array = function () {
	pos[0] = this.position.x;
	pos[1] = this.position.y;
	pos[2] = this.position.z;
	pos[3] = 1.0;
	return pos;
    };
};