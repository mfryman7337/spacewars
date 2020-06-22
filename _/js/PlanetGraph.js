function PlanetGraph (engine) {
    var visible_shader = makeProgram (engine.gl, '_/shaders/vert_visible.glsl', '_/shaders/frag_visible.glsl');

    var that = this;
    var count = 0;
    
    this.vertices = [];
    this.edges = [];
    
    this.homePlanets = [];
    this.maxPlayers = 0;
    
    var textures = {};
    var planets = {};
    
    //Adds a passed planet to the list of home planets for this graph.
    this.addHomePlanet = function(planet) {
        
        this.homePlanets.push(planet);
        this.maxPlayers++;
    };

    //Removes a random home planet from the list and returns it.
    this.takeHomePlanet = function() {
        
        if (this.homePlanets.length == 0) {
            throw "There are no home planets left";
        }
        
        var index = Math.floor(Math.random() * this.homePlanets.length);
        var toReturn = this.homePlanets[index];
        
        this.homePlanets.splice(index, 1);
        return toReturn;
    };
    
    this.vertex = function (data) {
        var v = new PlanetVertex (data, engine, this, count);
        count ++;
        if (!textures[data.tex.id]) {
            textures[data.tex.id] = data.tex; 
            planets[data.tex.id] = [];
        }
        planets[data.tex.id].push (v);
        this.vertices.push (v);
        return v;
    };
    
    this.unvisit = function () {
        for (var i = 0; i < this.vertices.length; i ++) {
            this.vertices[i].visited = false;
        }
    };
    
    this.dfs = function (pre, post) {
        this.unvisit ();
        for (var i = 0; i < this.vertices.length; i ++) {
            var v = this.vertices[i];
            if (!v.visited)
                v.dfs (pre, post);
        }
    };
    
    this.make_edge = function (v1, v2) {
        if (v1.id > v2.id) {
            var tmp = v1;
            v1 = v2;
            v2 = tmp;
        }
        if (v1.get_edge (v2)) {
            return;
        }
        var edge = new PlanetEdge (v1, v2, engine);
        
        v1.edges.push (edge);
        v2.edges.push (edge);
        this.edges.push (edge);
        
        v1.neighborPlanets.push(v2);
        v2.neighborPlanets.push(v1);
    };
    
    engine.scene.push (this);
    
    this.select_planet = function (pos) {
        for (var i = 0; i < this.vertices.length; i ++) {
            var v = this.vertices[i];
            var dist = Math.sqrt ((v.position.x - pos.x) * (v.position.x - pos.x) + (v.position.y - pos.y) * (v.position.y - pos.y));
            if (dist <= v.data.r)
                return v;
        }
        return null;
    };
    
    this.unselect = function () {
        for (var i = 0; i < this.vertices.length; i ++) {
            this.vertices[i].unselect();
        }
    };
    
    var start_screen = engine.camera.project (new vect (0, 0));
    
    this.draw = function (gl, test) {
        gl.useProgram(edge_shader);

	edge_shader.data ('screen', engine.camera.glMatrix ());
	edge_shader.data ('dist_in', edge_dist_buffer);
        
        for (var i = 0; i < this.edges.length; i ++) {
            this.edges[i].draw (gl);
	    }
        
        gl.useProgram(planet_shader);
        planet_shader.data ('screen', engine.camera.glMatrix ());
        planet_shader.data ('mineSampler', planet_mine);
        planet_shader.data ('baseSampler', planet_base);
        
        for (key in textures) {
            planet_shader.data ('texSampler', textures[key]);
            
            for (var i = 0; i < planets[key].length; i ++) {
                planets[key][i].draw (gl);
            }
        }
    };

    this.draw_visible = function (gl) {
        gl.useProgram(visible_shader);	
	
	visible_shader.data ('screen', engine.camera.glMatrix ());
	
	for (var i = 0; i < this.vertices.length; i ++) {
	    if (this.vertices[i].visible)
		this.vertices[i].draw_visible (gl);
	}
    };
    
    var in_network = function (player, u, v) {
        u.visited = true;
        if (u.owner != player.id)
            return false;
        if (u == v)
            return true;
        for (var i = 0; i < u.neighbors (); i ++) {
            if (u.next (i).visited)
                continue;
            if (in_network (player, u.next (i), v))
                return true;
        }
        return false;
    };
    
    this.in_network = function (player, u, v) {
        this.unvisit ();
        return in_network (player, u, v);
    };
    
    this.zero = function (player) {
        for (var i = 0; i < this.edges.length; i ++) {
            if (player.id == this.edges[i].owner) {
                this.edges[i].supply = 0;
                this.edges[i].pre_supply = 0;
            }
        }
        for (var i = 0; i < this.vertices.length; i ++) {
            if (player.id == this.vertices[i].owner) {
                    this.vertices[i].supply = 0;
                    this.vertices[i].pre_supply = 0;
                    this.vertices[i].troops = 0;
                    this.vertices[i].pre_troops = 0;
		    this.vertices[i].contrib = [];
                }
        }
    };
    
    var supply = function (player, u, contrib) {
        if (contrib <= 0)
            return;
        u.visited = true;
        for (var i = 0; i < u.neighbors (); i ++) {
            var v = u.next (i);
            var edge = u.edge (i);
            if (player.id != edge.owner)
                continue;
            if (edge.pre_supply < contrib) {
                edge.pre_supply = contrib;
                v.pre_supply = contrib;
                supply (player, v, contrib - 1);
            }
        }
    };
    
    var commit_supply = function (player) {
        for (var i = 0; i < that.edges.length; i ++) {
            that.edges[i].supply += that.edges[i].pre_supply;
        }
        for (var i = 0; i < that.vertices.length; i ++) {
            that.vertices[i].supply += that.vertices[i].pre_supply;
        }
        for (var i = 0; i < that.edges.length; i ++) {
            that.edges[i].pre_supply = 0;
        }
    };
    
    var military = function (player, u, contrib) {
        if (contrib <= 0)
            return;
        u.visited = true;
        u.pre_troops = contrib;
        var next = Math.floor (contrib / 2);
        for (var i = 0; i < u.neighbors (); i ++) {
            var v = u.next (i);
            if (player.id != u.edge (i).owner)
                continue;
            if (v.pre_troops < next) {
                military (player, v, next);
            }
        }
    };
    
    var commit_military = function (player) {
        for (var i = 0; i < that.vertices.length; i ++) {
            that.vertices[i].troops += that.vertices[i].pre_troops;
        }
    };
    
    this.update = function (player) {
        //this.zero (player);
        //this.supply (player);
        //this.military (player);
        //this.update_text (player);
    };
    
    this.update_text = function (player) {
        for (var i = 0; i < this.vertices.length; i ++) {
            var v = this.vertices[i];
            if (v.owner == player.id) {
                v.text (v.troops + '/' + v.supply);
                //v.text (v.troops);
            }
        }
    };
    
    this.supply = function (player) {
        console.log ('supply');
        for (var i = 0; i < player.mining.length; i ++) {
            this.unvisit ();
            var u = player.mining[i];
            supply (player, u, 3);
            commit_supply (player);
        };
    };
    
    this.military = function (player) {
        console.log ('military');
        for (var i = 0; i < player.military.length; i ++) {
            this.unvisit ();
            var u = player.military[i];
            military (player, u, u.stationed);
            commit_military (player);
        };
    };
    
    this.add_military = function (player) {
        console.log ('add military');
        for (var i = 0; i < player.military.length; i ++) {
            console.log (player.military[i].supply);
            player.military[i].stationed += player.military[i].supply + 1;
        }
    };
    
    this.dijkstra = function (player, u) {
         var results = {};
         var prev = {};
         var queue = [];
         
         var find_min = function () {
             var index = -1;
             var min = Infinity;
             for (var i = 0; i < queue.length; i ++) {
                 var v  = queue[i];
                 if (min > results[v.id]) {
                     min = results[v.id];
                     index = i;
                 }
             }
             var v = queue.splice (index, 1)[0];
             return v;
         };
         
         for (var i = 0; i < this.vertices.length; i ++) {
             var v = this.vertices[i];
             results[v.id] = Infinity;
             prev[v.id] = null;
             queue.push (v);
         }
         results[u.id] = 0;
         while (queue.length > 0) {
             var v = find_min ();
             if (v.owner != -1 && v.owner != player.id) {
                 continue;
             }
             for (var i = 0; i < v.neighbors (); i ++) {
                 var w = v.next (i);
                 if (w.owner != -1 && w.owner != player.id) {
                     continue;
                 }
                 var dist = results[v.id] + 1;
                 if (dist < results[w.id]){
                     results[w.id] = dist;
                     prev[w.id] = v;
                 }
             }
         }
        return {
            prev: prev,
            dist: results
        };
    };

    var walk_visible = function (player, v) {
	v.visible = true;
	v.visited = true;
	var no_walk = false;
	if (v.owner != player.id) {
	    no_walk = true;
	}
	for (var i = 0; i < v.neighbors (); i ++) {
	    var u = v.next (i);
	    var e = v.edge (i);
	    e.visible = true;
	    if (no_walk && !u.visited) {
		e.fade (u);
	    }
	    else
		e.fade (0);
	    if (!u.visited && !no_walk)
		walk_visible (player, u);
	}
    };

    this.visible = function (player) {
	return;
	for (var i = 0; i < this.vertices.length; i ++) {
	    this.vertices[i].visible = false;
	    this.vertices[i].visited = false;
	}
	for (var i = 0; i < this.edges.length; i ++) {
	    this.edges[i].visible = false
	}
	walk_visible (player, player.home);
    };
};