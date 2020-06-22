//PlanetVertex.js -- Russel Mommaerts, Joe Kohlmann, Zack Krejci, James Merrill
var edge_shader = null;

var unowned_color = new Float32Array ([0.6, 0.65, 0.8]);
var high_color = new Float32Array ([0.0, 0.6, 0.0]);
var med_color = new Float32Array ([1.0, 0.7, 0.0]);
var low_color = new Float32Array ([0.7, 0.0, 0.0]);

var edge_dist_buffer;

var HIGH = 6.0;
var MED = 3.0;

(function() {

    var edge_dist = [
        0.0, -10, 
	1.0,  10, 
	0.0,  10, 
	1.0,  10, 
	0.0, -10,
	1.0, -10
    ];
    PlanetEdge = function(v, u, engine) {
     
        var init = function () {
            edge_shader = makeProgram (engine.gl, '_/shaders/vert_edge.glsl', '_/shaders/frag_edge.glsl');
	    edge_dist_buffer = glBuffer (engine.gl, edge_dist, 2, 6);
        }

        if (!edge_shader)
            init ();

        this.v = v;
        this.u = u;
        this.owner = 0;
        this.supply = 0;
	this.visible = false;
	this.fade_dir = 0;

        var dir = vect.sub (new vect (v.position.x, v.position.y), new vect (u.position.x, u.position.y));
        dir.normalize ();
        dir.rotateZ (Math.PI / 2.0);
        dir.scale (100);

        var verts = [
            v.position.x - dir.x, v.position.y - dir.y, 0.0, 1.0,
            u.position.x + dir.x, u.position.y + dir.y, 0.0, 1.0,
            v.position.x + dir.x, v.position.y + dir.y, 0.0, 1.0,

            u.position.x + dir.x, u.position.y + dir.y, 0.0, 1.0,
            v.position.x - dir.x, v.position.y - dir.y, 0.0, 1.0,
            u.position.x - dir.x, u.position.y - dir.y, 0.0, 1.0,
        ];

        var edge_buffer = glBuffer (engine.gl, verts, 4, 6);
        //var color = new Float32Array ([0.0, 0.0, .8, 0.7]);

        var owned = false;
        this.claim = function (player) {
            this.owner = player.id;
            owned = true;
            player.edges.push(this);
            //color = new Float32Array ([0.7, 0.0, 0.0, 1.0]);
        };
        
        //Abandons the edge, leaving it with no owner
        this.abandon = function() {            
            this.owner = 0;
            owned = false;
        };

	this.color = function () {
	    this.deltaU = 0.0;
	    this.deltaV = 0.0;

	    this.colorU = unowned_color;
	    this.colorV = unowned_color;
	    this.colorM = unowned_color;

	    if (!owned) {
		this.colorM = unowned_color;
	    }
            else if (this.supply >= HIGH) {
		this.colorM = high_color;
	    }
            else if (this.supply >= MED){
		this.colorM = med_color;
	    }
            else {
		this.colorM = low_color;
	    }

	    this.colorFactorU = 1.0;
	    this.alphaFactorU = 1.0;
	    this.widthU = 1.0;
	    this.f_radU = .6;
	    
	    this.colorFactorV = 1.0;
	    this.alphaFactorV = 1.0;
	    this.widthV = 1.0;
	    this.f_radV = .6;

	    this.colorFactorM = 1.0;
	    this.alphaFactorM = 1.0;
	    this.widthM = 1.0;
	    this.f_radM = .6;

	    
	};
	this.color ();

	this.center = function (s, t) {
	    var bottom = vect.sub (this.v.position, this.u.position);
	    bottom.scale (s);
	    var top = vect.sub (this.v.position, this.u.position);
	    top.scale (1 - t);
	    var center = vect.sub (top, bottom);
	    center.scale (.5);
	    return vect.add (this.v.position, center);
	};

	this.width = function (s, t) {
	    var bottom = vect.sub (this.v.position, this.u.position);
	    bottom.scale (s);
	    var top = vect.sub (this.v.position, this.u.position);
	    top.scale (1 - t);
	    return vect.dist (top, bottom);
	};

	this.fade = function (u) {
	    if (u == this.u)
		this.fade_dir = -1;
	    else if (u == this.v)
		this.fade_dir = 1;
	    else
		this.fade_dir = 0;
	};
	
        this.draw = function (gl) {
            //gl.bindBuffer (gl.ARRAY_BUFFER, edge_buffer);
            //gl.vertexAttribPointer (edge_shader.pos, edge_buffer.itemSize, gl.FLOAT, false, 0, 0);  
	    edge_shader.data ('pos', edge_buffer);

	    edge_shader.data ('colorU', this.colorU);
	    edge_shader.data ('deltaU', this.deltaU);	
	    edge_shader.data ('colorFactorU', this.colorFactorU);
	    edge_shader.data ('alphaFactorU', this.alphaFactorU);
	    edge_shader.data ('widthU', this.widthU);
	    edge_shader.data ('f_radU', this.f_radU);

	    edge_shader.data ('colorV', this.colorV);
	    edge_shader.data ('deltaV', this.deltaV);	
	    edge_shader.data ('colorFactorV', this.colorFactorV);
	    edge_shader.data ('alphaFactorV', this.alphaFactorV);
	    edge_shader.data ('widthV', this.widthV);
	    edge_shader.data ('f_radV', this.f_radV);

	    edge_shader.data ('colorM', this.colorM);
	    edge_shader.data ('colorFactorM', this.colorFactorM);
	    edge_shader.data ('alphaFactorM', this.alphaFactorM);
	    edge_shader.data ('widthM', this.widthM);
	    edge_shader.data ('f_radM', this.f_radM);

	    edge_shader.data ('fade', this.fade_dir);

            //gl.bindBuffer (gl.ARRAY_BUFFER, dist_buffer);
            //gl.vertexAttribPointer (edge_shader.dist_in, dist_buffer.itemSize, gl.FLOAT, false, 0, 0);      
	    //edge_shader.data ('dist_in', dist_buffer);

            //gl.uniform1i (edge_shader.owned, owned);
	    //edge_shader.data ('owned', owned);

            /*if (!owned)
                gl.uniform4fv (edge_shader.color, unowned_color);
            else if (this.supply >= 3)
                gl.uniform4fv (edge_shader.color, high_color);          
            else if (this.supply >= 2)
                gl.uniform4fv (edge_shader.color, med_color);           
            else
	        gl.uniform4fv (edge_shader.color, low_color);           */
	    /*if (!owned)
                edge_shader.data ('color1', unowned_color);
            else if (this.supply >= 3)
                edge_shader.data ('color1', high_color);
            else if (this.supply >= 2)
                edge_shader.data ('color1', med_color);
            else
	         edge_shader.data ('color1', low_color);*/

            gl.drawArrays (gl.TRIANGLES, 0, edge_buffer.numItems);  
        };
    };
})();