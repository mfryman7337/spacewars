var RAD = 30;
var THICK = 10;

var SAMPLE = 10;

var key_count = 0;

var bound;

function Boundary (engine, player) {
    var init = function () {
	$(document).keydown (function (event) {
		if (event.keyCode == 189)
		    key_count --;
		else if (event.keyCode == 187)
		    key_count ++;
	    });
	bound = true;
    }
    if (!bound)
	init ();
    var color = player.color;
    var count = 0;
    var control = [];
    var arrow_verts = [];
    var arrow_glows = [];
    var arrow_buffer = null;
    var arrow_glow_buffer = null;
    var planets = {};
    var planet_keys;
    var verts = [];
    var glows = [];


    var min_angle = function (dir, next, anchor) {
	var min_quad = 5;
	var min_val = -Infinity;
	var min_index = -1;
	for (var i = 0; i < next.length; i ++) {
	    var d = vect.dir (next[i], anchor);
	    var dot = vect.dot2d (dir, d);
	    //console.log (dir, d, dot);
	    var cross = vect.cross2d (dir, d);
	    var val;
	    var quad;
	    if (dot >= 0 && cross >= 0) {
		quad = 1;
		val = dot;
	    }
	    else if (dot < 0 && cross >= 0) {
		quad = 2;
		val = 1 + dot;
	    }
	    else if (dot < 0 && cross < 0) {
		quad = 3;
		val = - dot;
	    }	    
	    else {
		quad = 4;
		val = 1 - dot;
	    }
	    if (quad < min_quad) {
		//console.log ('1', min_index, i);
		min_quad = quad;
		min_val = val;
		min_index = i;	
	    }
	    else if (quad == min_quad) {
		//console.log ('1.5', min_index, i, dot);
		if (val > min_val) {
		    //console.log ('2', min_index, i);
		    min_quad = quad;
		    min_val = val;
		    min_index = i;
		}
	    }
	}
	return min_index;
    };

    var count = 0;
    var order = [];
    var all_visited = [];
    var arrows = [];
    var start_count = 0;
    var configure = function (current, prev, start, dir) {
	/*if (prev) {
	    var hack_dir = vect.dir (prev.position, current.position);
	    hack_dir.scale (current.data.r + RAD);
	    control.push (current.position, hack_dir);
	}*/
	var added = 0;
	if (current == start)
	    start_count --;
	if (start_count < 0) {
	    console.log ("Runaway path");
	    return;
	}
	     
	if (current.id in planets) {
	    delete planets[current.id];
	    planet_keys --;
	}
	for (var i = 0; i < all_visited.length; i ++) {
	    if (current == all_visited[i]) {
		all_visited.splice (i, 1);
		break;
	    }
	}
	order.push (current);
	var pre_control = [];
	var adj = [];
	var last = false;
	if (current == start && prev != null /*&& all_visited.length == 0*/) {
	    if (control.length == 0) {
		throw "bad control";
	    }
	    pre_control.push (control[0]);
	    adj.push (null);
	    last = true;
	}
	var v;
	//if (prev && !last)
	//    v = vect.dir (prev.position, current.position);
	//else
	v = new vect (1, 0);
	for (var i = 0; i < 4; i++) {
	    v = vect.rotateZ (v, 2 * Math.PI / 4);
	    var rad = 2.0 * current.data.r + RAD;
	    pre_control.push (vect.add (current.position, vect.scale (v, rad)));
	    adj.push (null);
	}
	//if (!last) {
	    for (var i = 0; i < current.neighbors (); i ++) {
		var v = current.next (i);
		if (v == prev)
		    continue;
		if (v.owner != player.id)
		    continue;
		//pre_control.push (vect.dir (v.position, current.position));
		pre_control.push (v.position);
		adj.push (v);
	    }
	//}
        //count ++;
	if (count > 1000) {
	    console.log ('Runaway Path');
	    return;
	}
	//console.log ('adding path', count);
	while (pre_control.length > 0) {
	    var index = min_angle (dir, pre_control, current.position);
	    if (index == 0 && last) {
		return;
	    }
	    if (adj[index]){
		if (control.length == 0) {
		    dir.rotateZ (- Math.PI / 2);
		    return configure (current, prev, start, dir);
		    //throw "Suspictions confirmed";
		    //var hack_dir = vect.dir (adj[index].position, current);
		    //hack_dir.scale (current.data.r + RAD);
		    //control
		}
		var new_dir = vect.dir (current.position, adj[index].position);
		//new_dir.scale (-1);
		//console.log ('next');
		return configure (adj[index], current, start, new_dir);
	    }
	    //order.push (current);
	    control.push (pre_control[index]);
	    pre_control.splice (index, 1);
	    adj.splice (index, 1);
	    added ++;
	}
	if (prev) {
	    var new_dir = vect.dir (current.position, prev.position);
	    return configure (prev, current, start, new_dir);	
	}
	return;
	
	//while (true) {
	//console.log ('dir', dir, dir.length ());
	//if (count > 1000) {
	//    throw "Bad pathfinding algorithm";
	//}
	if (current == start && prev != null) {
	    //sample ();
	    return;
	}
    }

    var cubic_t = [];
    for (var i = 0; i < SAMPLE; i ++) {
	var t = i / SAMPLE;
	cubic_t.push ([t * t * t, t * t, t, 1]);
    };

    var row_col = function (row, col, factor) {
	var sum = new vect (0, 0);
	for (var i = 0; i < 4; i ++) {
	    var current = col[i].clone ();
	    current.scale (row[i]);
	    sum.add (current);
	}
	if (factor)
	    sum.scale (factor);
	return sum;
    };

    var pos_buffer, glow_buffer;

    var sample = function (start) {
	var spline = [];
	//console.log (control);

	for (var i = 0; i < control.length; i ++) {
	    //console.log ('p', control[i].x, control[i].y);
	    var i0 = (i - 1);
	    if (i0 < 0)
		i0 += control.length;
	    var p0 = control [i0];
	    var p1 = control [i];
	    var p2 = control [(i + 1) % control.length];
	    var p3 = control [(i + 2) % control.length];
	    var points = [p0, p1, p2, p3];
	    var blend = [];
	    blend.push (row_col ([-1, 3, -3, 1], points));
	    blend.push (row_col ([3, -6, 3, 0], points));
	    blend.push (row_col ([-3, 0, 3, 0], points));
	    blend.push (row_col ([1, 4, 1, 0], points));
	    for (var j = 0; j < SAMPLE - 1; j ++) {
		var p = row_col (cubic_t [j], blend, 1 / 6);
		spline.push (p);
		//console.log ('pushing', p.x, p.y);
	    }
	}
	//console.log (player.id, spline);

	var out_edges = []
	var winning = [];

	var dfs = function (planet) {
	    planet.visited = true;
	    for (var i = 0; i < planet.neighbors ();  i ++) {
		var e = planet.edge (i);
		//e.color ();
		if (e.u.owner != e.v.owner) {
		    out_edges.push (e);
		    if (planet.next (i).troops < planet.troops) {
			//var val = Math.floor ((planet.troops / planet.next (i).troops - 1.0) * 4.0 + 1);
			var val = Math.floor ((planet.troops - planet.next (i).troops) * 2 / 5).clamp (0, 2) + 1;
			//var val = 1;
			if (val > 5)
			    val = 5;
			winning.push (val);
			//console.log ('hit', player.id, planet.next (i).troops, planet.troops);
		    }
		    else {
			//console.log ('miss', player.id, planet.next (i).troops, planet.troops);
			winning.push (0);
		    }
		}
	    }
	    for (var i = 0; i < planet.neighbors ();  i ++) {
		var v = planet.next (i);
		if (v.owner == player.id && !v.visited)
		    dfs (v);
	    }
	};

	engine.graph.unvisit ();
	arrows = [];
	dfs (start);
	//console.log ('e', out_edges.length);


	var z = 0.0;
	function add_vertex (v, g) {
	    //console.log (v.x, v.y);
	    verts.push (v.x);
	    verts.push (v.y);
	    verts.push (0.0);
	    verts.push (1.0);	 

	    glows.push (0.5);
	    glows.push (g);

	    //z += 0.0;
	};

	//console.log ('start');
	for (var i = 0; i < spline.length; i ++) {
	    var k = i + 1;
	    if (k >= spline.length)
		k -= spline.length;
	    for (var j = 0; j < out_edges.length;  j ++) {
		var e = out_edges[j];
		if (vect.intersect2d (spline[i], spline[k], e.u.position, e.v.position)) {
		    var t = vect.intersect2dt (spline[i], spline[k], e.u.position, e.v.position);
		    if (winning[j]) {
			e.colorM = player.color;
			e.f_radM = 1.5; //(frac) * .6 + (1 - frac) * 1.0;
			e.colorFactorM = 0.0;
			e.alphaFactorM = 1.0;
			e.widthM = 1.0;
			if (e.v.owner == player.id)			
			    arrows.push ([e.v, e.u, winning[j], e]);
			else
			    arrows.push ([e.u, e.v, winning[j], e]);
		    }
		    if (e.v.owner == player.id) {
			e.deltaV = 1.0 - t;
		    }
		    else {
			e.deltaU = t;
		    }
		    break;
		}
	    }
	}

	//var bary = [];
	var i = 0;
	var counter = 0;
	var p0, p1, p2, p4;
	var back;
	var forward = vect.dir (spline[1], spline[spline.length - 1]);
	forward.rotateZ (Math.PI / 2);
	forward.scale (100);
	p2 = vect.add (spline[0], forward);
	p3 = vect.sub (spline[0], forward);
	for (var i = 0; i < spline.length; i ++) {
	    var j = (i + 1);
	    if (j >= spline.length)
		j -= spline.length;
	    var k = (i + 2);
	    if (k >= spline.length)
		k -= spline.length;
	    back = forward;
	    forward = vect.dir (spline[k], spline[i]);
	    forward.rotateZ (Math.PI / 2);
	    forward.scale (100);
	    p0 = p2;
	    p1 = p3;
	    p2 = vect.add (spline[j], forward);
	    p3 = vect.sub (spline[j], forward);

	    if (vect.intersect2d (spline[i], p0, spline[j], p2)) {
		var s = vect.intersect2dt (spline[i], p0, spline[j], p2);
		var next = vect.sub (p2, spline[j]);
		next.scale (s);
		var pos = vect.add (spline[j], next);
		add_vertex (p1, -10.0);
		add_vertex (pos, s * 10.0);
		add_vertex (p3, -10.0);
		continue;
	    }
	    if (vect.intersect2d (spline[i], p1, spline[j], p3)) {
		var s = vect.intersect2dt (spline[i], p1, spline[j], p3);
		var next = vect.sub (p3, spline[j]);
		next.scale (s);
		var pos = vect.add (spline[j], next);
		add_vertex (p0, 10.0);
		add_vertex (pos, -s * 10.0);
		add_vertex (p2, 10.0);
		continue;
	    }
	    

	    add_vertex (p0, 10.0);
	    add_vertex (p1, -10.0);
	    add_vertex (p2, 10.0);

	    add_vertex (p1, -10.0);
	    add_vertex (p3, -10.0);
	    add_vertex (p2, 10.0);

	}

	var k = 0;
	/*for (var i = 0; i < spline.length; i ++) {
	    var j = i + 1;
	    if (j >= spline.length)
		j -= spline.length;
	    if (!vect.left2d (spline[i], spline[j], order[k].position)) {
		console.log (vect.left2d (spline[i], spline[j], order[k].position), vect.left2d (spline[j], spline[i], order[k].position));
		k ++;
	    }*/
	    /*if (run >= SAMPLE) {
		k ++;
		run = 0;
	    }*/
		
	    
	    //if (k >= order.length)
	    //k -= order.length;
	    /*if (vect.dist (spline[i], order[k].position) > vect.dist (spline[i], order[(k + 1) % order.length].position)) {
		add_triangle (spline[i], order[(k + 1) % order.length].position, order[k].position, 0.0, -10.0, -10.0);		
		k = (k + 1) % order.length;
		
	    }
	    
	    add_triangle (spline[i], spline[j], order[k].position, 0.0, 0.0, -10.0);
	    //run ++;
	}*/
	//console.log (verts.length);

	/*var i = -1;
	var count = spline.length;
	while (spline.length >= 3) {
	    i ++;
	    if (i >= spline.length) {
		if (count == spline.length){
		    console.log ('bad ear removal', spline.length, 'player', player.id);
		    break;
		}
		count = spline.length;
		i -= spline.length;
	    }
	    var j = (i + 1);
	    if (j >= spline.length)
		j -= spline.length;
	    var k = (i + 2);
	    if (k >= spline.length)
		k -= spline.length;
	    if (!vect.left2d (spline[i], spline[k], spline[j], 0.0)) {
		var okay = true;
		for (var m = 0; m < spline.length; m ++) {
		    var l = m + 1;
		    if (l >= spline.length)
			l -= spline.length;
		    if (l == i || l == k || m == i || m == k)
			continue;
		    if (vect.intersect2d (spline[i], spline[k], spline[m], spline[l], 0)) {
			okay = false;
			break;
		    }
		}
		if (okay) {
		    add_triangle (spline[i], spline[j], spline[k]);
		    spline.splice (j, 1);
		}
	    }
	}*/

        //bary_buffer = glBuffer (engine.gl, bary, 3, bary.length / 3);
    };

    this.reconfigure = function () {
	arrow_verts = [];
	arrow_glows = [];
	glows = [];
	verts = [];
	planet_keys = 0;
	var lastRound = null;

	planets = {};
	for (var i = 0; i < engine.graph.vertices.length; i ++) {
	    if (engine.graph.vertices[i].owner == player.id) {
		planets[engine.graph.vertices[i].id] = engine.graph.vertices[i];
		planet_keys ++;
	    }
	}

	while (true) {
	    if (planet_keys <= 0)
		break;
	    count = 0;
	    control = [];
	    order = [];
	    all_visited = [];
	    start_count = 1;
   
	    var min_y = Infinity;
	    var start = null;
	    var flag = false;
	    
	    for (key in planets) {
		var v = planets[key];
		if (lastRound) {
		    if (engine.graph.in_network (player, lastRound, v)) {
			delete planets[v.id];
			planet_keys --;
			flag = true;
			break;
		    }
		}
		if (min_y > v.position.y) {
		    min_y = v.position.y;
		    start = v;
		}
	    }
	    
	    if (flag)
		continue;
	    
	    if (start == null)
		return;
	
	    for (var i = 0; i < start.neighbors (); i ++) {
		if (start.edge (i).owner == player.id) {
		    all_visited.push (start.next (i));
		    start_count ++;
		}
		
	    }

	    configure (start, null, start, new vect (0, -1));
	    sample (start);

	    lastRound = start;
	}
	
	pos_buffer = glBuffer (engine.gl, verts, 4, verts.length / 4);
	glow_buffer = glBuffer (engine.gl, glows, 2, glows.length / 2);
    };
    this.reconfigure ();

    function add_vertex_arrow (v, g) {
	//console.log (v.x, v.y);
	arrow_verts.push (v.x);
	arrow_verts.push (v.y);
	arrow_verts.push (0.0);
	arrow_verts.push (1.0);	 
	
	arrow_glows.push (0.5);
	arrow_glows.push (g);
    };

    var add_triangle = function (t1, t2, t3, g1, g2, g3) {
	add_vertex_arrow (t1, g1);
	add_vertex_arrow (t2, g2);
	add_vertex_arrow (t3, g3);
    };
    
    var triangulate_arrow = function (pos, on, out) {
	var p0 = vect.add (pos, on);
	var p1 = pos.clone ();
	var p2 = vect.sub (pos, on);
	var p3 = vect.add (p0, out);
	var p4 = vect.add (p1, out);
	var p5 = vect.add (p2, out);
	var out2 = out.clone ();
	var p6 = vect.add (p3, out);
	var p7 = vect.add (p4, out);
	var p8 = vect.add (p5, out);
	
	add_triangle (p0, p1, p4, 10.0, 0.0, 0.0);
	add_triangle (p0, p4, p3, 10.0, 0.0, 10.0);
	add_triangle (p1, p2, p5, 0.0, 10.0, 10.0);
	add_triangle (p1, p5, p4, 0.0, 10.0, 0.0);
	add_triangle (p3, p4, p7, 10.0, 0.0, 10.0);
	add_triangle (p3, p7, p6, 10.0, 10.0, 10.0);
	add_triangle (p4, p5, p8, 0.0, 10.0, 10.0);
	add_triangle (p4, p8, p7, 0.0, 10.0, 10.0);
    };
    
    var add_arrow = function (v, u, delta) {
	var half = vect.sub (v, u);
	half.scale (delta);
	var pos = vect.add (u, half);
	
	var on = vect.dir (v, u);
	on.scale (50);
	
	var out = vect.sub (v, u);
	out.normalize ();
	out.rotateZ (-Math.PI / 4);
	out.scale (50);
	
	triangulate_arrow (pos, on, out);
	
	out = vect.sub (v, u);
	out.normalize ();
	out.rotateZ (Math.PI / 4);
	out.scale (50);
	
	triangulate_arrow (pos, on, out);
	
    };

    this.add_arrows = function () {
	arrow_verts = [];
	arrow_glows = [];
	for (var i = 0; i < arrows.length; i ++) {
	    var u = arrows[i][0];
	    var v = arrows[i][1];
	    var count = arrows[i][2];
	    var e = arrows[i][3];
	    var half = (1 - e.deltaU - e.deltaV) / 2;
	    var mod;
	    if (e.v.owner == player.id)
		mod = e.deltaU + half;
	    else
		mod = e.deltaV + half;	     
	    mod -= count / 2 * .05;
	    for (var j = 0; j < count; j ++) {
		add_arrow (u.position, v.position, mod);
		mod += .05;
	    }
	}
	if (arrow_verts.length > 0) {
	    arrow_buffer = glBuffer (gl, arrow_verts, 4, arrow_verts.length / 4);
	    arrow_glow_buffer = glBuffer (gl, arrow_glows, 2, arrow_glows.length / 2);
	}
	else {
	    arrow_buffer = null;
	    arrow_glow_buffer = null;
	}
    };

    this.draw = function (gl) {
        gl.useProgram(edge_shader);
	edge_shader.data ('screen', engine.camera.glMatrix ());
        edge_shader.data ('pos', pos_buffer);	
	//edge_shader.data ('bary_in', bary_buffer);	
        edge_shader.data ('dist_in', glow_buffer);
	
	edge_shader.data ('colorM', player.color);
	edge_shader.data ('colorU', low_color);
	edge_shader.data ('colorV', high_color);
	//edge_shader.data ('color2', player.color);
	edge_shader.data ('deltaU', 0.0);
	edge_shader.data ('deltaV', 0.0);
	edge_shader.data ('f_radM', 1.5);
	edge_shader.data ('colorFactorM', 0.0);
	edge_shader.data ('alphaFactorM', 1.0);
	edge_shader.data ('widthM', 1.0);

	edge_shader.data ('fade', 0);
	//if (player.id == 1)
	//    gl.drawArrays (gl.TRIANGLES, 0, key_count); 
	//else
	    gl.drawArrays (gl.TRIANGLES, 0, pos_buffer.numItems); 

	if (arrow_buffer) {
	    edge_shader.data ('pos', arrow_buffer);	
	    edge_shader.data ('dist_in', arrow_glow_buffer);

	    gl.drawArrays (gl.TRIANGLES, 0, arrow_buffer.numItems); 
	}
    }
   
};

/*var arrows = [];
var arrow_buffer;

function clear_arrows (graph) {
    arrow_buffer = null;
};

function add_arrows (graph) {
    arrows = [];
    for (var i = 0; i < graph.edges.length; i ++) {
	var e = graph.edges[i];
	var center = e.center (e.deltaU, e.deltaV);
	var center = e.width (e.deltaU, e.deltaV);
    }
    
	var mod = .4;
	for (var p = 0; p < winning[j]; p ++) {
	    if (e.v.owner == player.id)			
		arrow (e.v.position, e.u.position, mod);
	    else
		arrow (e.u.position, e.v.position, mod);
	    mod += .1;
	}
};*/