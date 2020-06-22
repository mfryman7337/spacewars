function Cloud (start) {
    var dist = start.radius + 25;
    var max = new vect (1, 1);
    var alt = new vect (1, -1);
    max.scale (dist);
    alt.scale (dist);
    var control = [
        vect.sub (start.position, max),
	vect.sub (start.position, alt),
	vect.add (start.position, max),
	vect.sub (start.position, alt)
    ];
    for (var i = 0; i < control.length; i ++) {
	for (var j = 0; j < 10; j ++) {
	    var p0 = control [(i - 1) % control.length];
	    var p1 = control [i % control.length];
	    var p2 = control [(i + 1) % control.length];
	    var p3 = control [(i + 2) % control.length];
	};
    }
};