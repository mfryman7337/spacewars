//PlanetVertex.js -- Russel Mommaerts, Joe Kohlmann, Zack Krejci, James Merrill
var planet_shader = null;
var planet_mine = null;
var planet_base = null;
var LIGHT_POS = new vect (0, 0, 300);

var PlanetVertex = function(data, engine, graph, id) {
    var that = this;
    
    // Create the planet shaders if it doesn't already exist.
    var init = function () {
        
        planet_shader = makeProgram (engine.gl, '_/shaders/vert_planet.glsl', '_/shaders/frag_planet.glsl');
        planet_mine = getTexture ('_/tex/256-mine-outline.png');
        planet_base = getTexture ('_/tex/256-fortify-outline.png');
    }
    
    // Make the call to initialize the planet shader.
    if (! planet_shader)
        init();
    
    // Data Members
    this.position = data.position;
    this.graph = graph;
    this.id = id;
    this.data = data;
    this.visited = false;
    this.edges = [];
    this.neighborPlanets = [];
    this.owner = -1;
    this.ownerPlayer = null;
    this.supply = 0;
    // The number of turns that this planet can supply resources for when mined.
    this.supply_turns = Math.round( (data.r - 35) / 6 + 6);
    // Total amount 
    this.supply_total = this.supply_turns;
    this.troops = 0;
    this.contrib = [];
    this.troops_max = data.r ;
    this.stationed = 0;
    this.stationed_max = Math.round( (data.r - 35) / 3 + 20);
    this.mining = false;
    this.military = false;
    this.name = NameGenerator.generatePlanetName();
    this.visible = true;
    this.pre_troops = 0;
    this.pre_supply = 0;
    this.depleted = false;
    var text = 0;
    
    /** Utility function to convert the player color's RGB triple to an HTML rgba value.
      * Relies on Number.clamp() "sugar" added in sugar.js.
      * @param {Array.<integer>} [baseAmt = [0,0,0]] A base amount of color, given as to add to the player color to lighten or darken it. The color will be clamped to the range [0,0,0] to [1.0,1.0,1.0].
      * @param {String} [format = "array"] The format to return the color in. Accepts "array" and "rgba".
      */
    that.getPlanetColor = function(baseAmt, format) {
        /** @default [0,0,0] */
        if (baseAmt == null || baseAmt == undefined) {
            baseAmt = [0,0,0];
        }
        
        // Default the color to bright blue. We don't use this color for any players,
        // so it's the default selection color.
        var startColor = [0,0,0];
        if (that.ownerPlayer != null) {
            startColor = that.ownerPlayer.color;
        }
        
        var newColor = [
            (baseAmt[0] + startColor[0]).clamp(0,1),
            (baseAmt[1] + startColor[1]).clamp(0,1),
            (baseAmt[2] + startColor[2]).clamp(0,1),
        ];
        
        if (format == "rgba") {
            // Return a string like this: rgba(r,g,b,1), where r, g and b are 0-255.
            var colorString = "rgba(" +
                Math.round(newColor[0] * 255).clamp(0, 255) + "," +
                Math.round(newColor[1] * 255).clamp(0, 255) + "," +
                Math.round(newColor[2] * 255).clamp(0, 255) + ",1)";
            return colorString;
        } else {
            return newColor;
        }
    }
    
    var text_display = true;

    this.show_text = function (string, timer) {
        var pos = engine.camera.screen (that.position);
        var screenX = pos.x;
        var screenY = pos.y;
	var text = $ ('<p>' + string + '</p>');
	text.addClass ('army_count');
	$ ('#container').append (text);
	text.css ('left', screenX - text.width () / 2.0);
	text.css ('top', screenY - text.height () / 2.0);

	setTimeout (function () {
		text.remove ();
	    }, 1000);
    };
    
    var update_text = function () {
	return;
        var pos = engine.camera.screen (that.position);
        var screenX = pos.x;
        var screenY = pos.y; // + 30.0 / 4.0;
        if ((screenX > $('#container').width () || screenX < 0  || screenY > $('#container').height () || screenY < 0)) {       
            return;
        }
        engine._2d.fillStyle = 'white';
        engine._2d.font = 'bold 35px Trebuchet MS';
        engine._2d.textAlign = 'center';
        engine._2d.textBaseline = 'middle';
        engine._2d.shadowColor = 'black';
        engine._2d.shadowOffsetX = 4;
        engine._2d.shadowOffsetY = 4;
        engine._2d.shadowBlur = 5;
        engine._2d.fillText (text, screenX, screenY);
    };
    
	// Calculate the menu / tooltip position.
	var getMenuPosition = function() {
        // Calculate where the menu should go.
        var planetScreenPosition = engine.camera.screen(that.position);
        // Place the menu slightly below the planet.
        var menuPosition = {
            x: planetScreenPosition.x,
            y: planetScreenPosition.y + that.data.r * 0.75
        };
		
		return menuPosition;
	}
	
	that.canColonize = function() {
        var hasPlayerColonizedNeighbor = false;
        // Iterate through this planet's neighbors and figure out if one or more of them are player-colonzied planets.
        for (var i = 0; i < that.neighborPlanets.length; i++) {
            hasPlayerColonizedNeighbor = that.neighborPlanets[i].ownerPlayer == engine.getCurrentPlayer();
                
            // We only care about finding at least one planet that the player controls.
            if (hasPlayerColonizedNeighbor)
                break;
        }
            
        return !that.isOwned() && hasPlayerColonizedNeighbor;
	}
	
    // Verbs
    // A Verb object expects these properties:
    // show (function)
    // enabled (function)
    // action (function)
    var verbs = {};
    
    // This is a wrapper for verbs.colonize. At one point it did much more.
    verbs.setHomePlanet = {
        show: function() { return false; },
        enabled: function() { return !that.isOwned(); },
        action: function(newPlayer) {
            verbs.colonize.action(newPlayer);
        }
    };
	
    verbs.colonize = {
        show: function() { return that.ownerPlayer == null || that.ownerPlayer == engine.getCurrentPlayer(); },
        enabled: function() { return that.canColonize(); },
        shortcut: "c",
        action: function(newPlayer) {
            var currentPlayer = engine.getCurrentPlayer();
            
            if (newPlayer == null || newPlayer == undefined) {
                that.claim(currentPlayer);
            } else {
                that.claim(newPlayer);
            }
            
            // Just build edges to all the neighbors for now
            for (var i = 0; i < that.neighborPlanets.length; i++) {
                
                if (that.neighborPlanets[i].ownerPlayer == currentPlayer) {
                
                    var neighbor = that.neighborPlanets[i];
                    that.get_edge(neighbor).claim(currentPlayer);
                }
            }
            
            that.graph.update(currentPlayer);
			
			// engine.messages.log (currentPlayer.string () + ' colonized ' + that.name, that);
			
            that.unselect();
        }
    };
    
    verbs.attack = {
        show: function() { return that.ownerPlayer != null && that.ownerPlayer != engine.getCurrentPlayer(); },
        enabled: function() {
            
            if (!this.show()) {
                return false;
            }
            
            var currentPlayer = engine.getCurrentPlayer();
            
            // Otherwise look for an adjacent planet with troops
            for (var i = 0; i < that.edges.length; i++) {
                
                var planet = that.next(i);
                
                if (planet.ownerPlayer == currentPlayer && planet.troops > 0) {
                    return true;
                }
            }
            
            return false;
        },
        shortcut: "a",
        action: function() {
            
	    var playerPlanet = null;
            var playerTroops = 0;
            var currentPlayer = engine.getCurrentPlayer();

	    var enemyTroops = that.troops;

            // Sum all our adjacent troops
            for (var i = 0; i < that.edges.length; i++) {
                
                var planet = that.next(i);
                
                if (planet.ownerPlayer == currentPlayer && playerTroops < planet.troops) {
                    playerTroops = planet.troops;
		    playerPlanet = planet;
                }
            }

	    var val = Math.random () * (playerTroops + enemyTroops) - enemyTroops;
	    
	    if (val >= 0) {
		engine.messages.log (currentPlayer.string () + ' attacked ' + that.ownerPlayer.string () + ' at ' + that.name + ' and took the planet', that); 

		if (that.ownerPlayer.home == that) {
		    var ownerPlayer = that.ownerPlayer;
		    that.abandon();
		    var strongest = null;
		    var strongest_val = -Infinity;
		    for (var i = 0; i < ownerPlayer.planets.length; i ++) {
			if (ownerPlayer.planets[i].troops > strongest_val) {
			    strongest = ownerPlayer.planets[i];
			    strongest_val = ownerPlayer.planets[i].troops;
			}
		    }
		    if (strongest) {
			ownerPlayer.home = strongest;
		    }
		}
		else {
		    that.abandon();
		}
                that.verbs.colonize.action();		
		var win_ratio = val / playerTroops;
		
		var otherLoss = Math.floor (win_ratio * enemyTroops);
		playerLoss = Math.floor ((1.0 - win_ratio) * playerTroops);
		otherLoss = that.cull (otherLoss + 1);
		playerLoss = playerPlanet.cull (playerLoss);

		that.show_text ('-' + otherLoss);
		playerPlanet.show_text ('-' + playerLoss);
	    }
	    else {
		engine.messages.log (currentPlayer.string () + ' attacked ' + that.ownerPlayer.string () + ' at ' + that.name + ' and lost', that); 
		var loss_ratio = Math.abs (val / playerTroops);
		
		that.cull (((1.0 - loss_ratio) * enemyTroops));
		playerPlanet.cull (loss_ratio * playerTroops + 1);
	    }

            // Just defeat them
            /*if (that.troops < totalTroops) {
                
                that.abandon();
                that.verbs.colonize.action();
            }
            else {
                
                for (var i = 0; i < that.neighborPlanets.length; i++) {
                    
                    var planet = that.neighborPlanets[i];
                
                    if (planet.ownerPlayer == currentPlayer) {
                        planet.troops = 0;
                    }
                } // for
		} // else*/
        } // action
    };
    
    verbs.mine = {
        show: function() { return true; },
        enabled: function() { return !that.mining && !that.military && that.ownerPlayer == engine.getCurrentPlayer(); },
        shortcut: "m",
        action: function() {
            
            that.mining = true;
            that.ownerPlayer.mining.push(that);
            that.graph.update(that.ownerPlayer);
			engine.messages.log (that.ownerPlayer.string () + ' started mining ' + that.name, that);
        }
    };
    
    verbs.fortify = {
        show: function() { return true; },
        enabled: function() { return !that.mining && !that.military && that.ownerPlayer == engine.getCurrentPlayer(); },
        shortcut: "f",
        action: function() {
        
            that.military = true;
            that.ownerPlayer.military.push(that);
			engine.messages.log (that.ownerPlayer.string () + ' fortified ' + that.name, that);
        }
    };
    
    verbs.select = {
        show: function() { return false; },
        enabled: function() { return !that.selected && (that.ownerPlayer == engine.getCurrentPlayer() || that.ownerPlayer == null) && !engine.menu.active; },
        action: function() {
            selected = true;
            engine.scroller.disable();
        }
    };
    
    verbs.deselect = {
        show: function() { return false; },
        enabled: function() { return that.selected && !engine.menu.active; },
        action: function() {
            selected = false;
            engine.scroller.enable();
            that.unselect();
        }
    };
    
    verbs.displayMenu = {
        show: function() { return false; },
		// Enable the menu for human players only
        enabled: function() { return ! engine.getCurrentPlayer().comp; },
        action: function() {
            // Generate a description string for the planet to display in the "description" section of the menu.
            var description = "";
            var theColor = engine.menu.originalColor;
            if (that.ownerPlayer == null) {
                description += "Uncolonized. ";
            } else {
                theColor = that.getPlanetColor(null, "rgba");
                if (that.mining) {
                    description += "Mined";
                } else if (that.military) {
                    description += "Fortified";
                } else {
                    description += "Colonized";
                }
                
                description += " by ";
                
                if (engine.getCurrentPlayer() == that.ownerPlayer) {
                    description += "You! (Player " + that.owner + ")";
                } else {
                    description += "Player " + that.owner + ". ";
                }
            }
            
            verbs.select.action();
            engine.menu.show({
                color: theColor,
                verbs: verbs,
                position: getMenuPosition(),
                callback: function() {
                    verbs.deselect.action();
                },
                name: that.name,
                desc: description,
			planet: that
            });
        }
    };
	
	verbs.displayTooltip = {
		show: function() { return false; },
		enabled: function() { return true; },
		action: function() {
            var theColor = that.getPlanetColor(null, "rgba");
			
			engine.menu.showTooltip({
				color: theColor,
				position: getMenuPosition(),
				planet: that
			});
		}
	};
	
    // Lazy fix for now
    that.verbs = verbs;
    
    var verts = [
         this.position.x - 2.0 * this.data.r, this.position.y + 2.0 * this.data.r, 0.0, 1.0,
         this.position.x - 2.0 * this.data.r, this.position.y - 2.0 * this.data.r, 0.0, 1.0,
         this.position.x + 2.0 * this.data.r, this.position.y + 2.0 * this.data.r, 0.0, 1.0,
         
         this.position.x - 2.0 * this.data.r, this.position.y - 2.0 * this.data.r, 0.0, 1.0,
         this.position.x + 2.0 * this.data.r, this.position.y - 2.0 * this.data.r, 0.0, 1.0,
         this.position.x + 2.0 * this.data.r, this.position.y + 2.0 * this.data.r, 0.0, 1.0,
         ];
    var planet_buffer = glBuffer (engine.gl, verts, 4, 6);

    var vis = [
         this.position.x - 30.0 * this.data.r, this.position.y + 30.0 * this.data.r, 0.0, 1.0,
         this.position.x - 30.0 * this.data.r, this.position.y - 30.0 * this.data.r, 0.0, 1.0,
         this.position.x + 30.0 * this.data.r, this.position.y + 30.0 * this.data.r, 0.0, 1.0,
         
         this.position.x - 30.0 * this.data.r, this.position.y - 30.0 * this.data.r, 0.0, 1.0,
         this.position.x + 30.0 * this.data.r, this.position.y - 30.0 * this.data.r, 0.0, 1.0,
         this.position.x + 30.0 * this.data.r, this.position.y + 30.0 * this.data.r, 0.0, 1.0,
         ];
    var vis_buffer = glBuffer (engine.gl, vis, 4, 6);
    
    var circle = [
          -2, -2,
          -2, 2,
          2, -2,
          
          -2, 2,
          2, 2,
          2, -2
          ];
    var circle_buffer = glBuffer (engine.gl, circle, 2, 6);
    
    var tex = this.data.tex;
    
    var light_pos = vect.sub (LIGHT_POS, this.position);
    light_pos.normalize ();
    var light_buffer = new Float32Array ([light_pos.x, -light_pos.y, light_pos.z]);
    
    var selected = false, hover = false;
    
    this.text = function (string) {
        // console.log (string);
        text = string;
	//text = this.id;
    };
    
    this.select = function () {
        selected = true;
    };
    
    this.unselect = function () {
        selected = false;
        this.unhover();
    };

    this.hover = function () {
        hover = true;
    };

    this.unhover = function () {
        hover = false;
    };
    
    // For rotation effect!
    that.rotationSpeed = (Math.random() * (50 - 5 + 1) + 5) * (Math.random() > 0.5 ? 1 : -1)
    
    var omega = 0;
    
    this.draw = function (gl) {
        var deltaRotation = 0;
        
        // Rotate faster when hovered or selected.
        if (hover || selected) {
            deltaRotation = that.rotationSpeed / 16;
        } else {
            deltaRotation = that.rotationSpeed / 128;
        }
        
        omega += deltaRotation * engine.deltaTime;
        if (omega >= Math.PI * 2) {
            omega -= Math.PI * 2;
        }
	else if (omega < 0) {
	    omega += Math.PI * 2;
	}
        planet_shader.data ('omega', omega);
        
        planet_shader.data ('pos', planet_buffer);
        
        planet_shader.data ('circle_in', circle_buffer);
        
        planet_shader.data ('highlight', selected);
        planet_shader.data ('hover', hover);
        planet_shader.data ('mining', this.mining);
        planet_shader.data ('military', this.military);
        planet_shader.data ('capacity', this.stationed / this.stationed_max);
        planet_shader.data ('deplete', this.supply_turns / this.supply_total);
        
        //gl.uniform3fv (planet_shader.light_pos, light_buffer);
        planet_shader.data ('light_pos', light_buffer);
        
        //Player color tinting
        //gl.uniform3fv(planet_shader.playerColor, [1.0,0.0,1.0]);
        //gl.uniform1i(planet_shader.isOwned, this.isOwned());
        planet_shader.data ('playerColor', that.getPlanetColor());
        planet_shader.data ('isOwned', this.isOwned());
        
        gl.drawArrays (gl.TRIANGLES, 0, planet_buffer.numItems); 
        
        if (this.owner != -1) {
            update_text();
        }
    };

    this.draw_visible = function (gl) {
        planet_shader.data ('pos', vis_buffer);	
        planet_shader.data ('circle_in', circle_buffer);
        gl.drawArrays (gl.TRIANGLES, 0, vis_buffer.numItems); 
    };
    
    this.claim = function (player) {
        if (this.isOwned()) {
            throw "Cannot claim a planet that is already owned";
        }
        
        this.owner = player.id;
        this.ownerPlayer = player;
        this.playerColor = player.color;
        
        player.planets.push(this);
    };
    
    this.abandon = function() {
        if (!this.isOwned()) {
            throw "Cannot abandon a planet that is not owned.";
        }
        
        this.ownerPlayer.removePlanet(this);
        
        for (var i = 0; i < this.edges.length; i++) {
            this.edges[i].abandon();
        }
        
        this.owner = -1;
        this.ownerPlayer = null;
        
        this.mining = false;
        this.military = false;
        
        this.troops = 0;
        this.supply = 0;
        
        this.playerColor = [ 0, 0, 0 ];
        this.text("");
    };
    
    // Gets if the planet is owned by a player
    this.isOwned = function() {
        return this.ownerPlayer != null;
    }
    
    this.neighbors = function () {
        return this.edges.length;
    };
    
    this.edge = function (index) {
        return this.edges[index];
    };
    
    this.next = function (index) {
        edge = this.edges[index];
        if (edge.u.id == this.id)
            return edge.v;
        else
            return edge.u;
    };
    
    this.dfs = function (pre, post) {
        this.visited = true;
        pre (this);
        for (var i = 0; i < this.neighbors (); i ++) {
            var v = this.next (i);
            if (!v.visited)
            v.dfs (pre, post);
        }
        post (this);
    };
    
    this.get_edge = function (u) {
        for (var i = 0; i < this.neighbors (); i ++) {
            var v = this.next (i);
            if (u == v)
            return this.edge (i);
        }
        return null;
    };

    this.cull = function (troops) {
	var removed = 0;
	while (troops > 0) {
	    if (this.contrib.length <= 0)
		return removed;
	    var index = Math.floor (Math.random () * this.contrib.length);
	    //if (index >= this.contrib.length)
	    //    index --;
	    if (this.contrib[index].stationed <= 0) {
		this.contrib.splice (index, 1);
		continue;
	    }
	    this.contrib[index].stationed --;
	    troops --;
	    removed ++;
	}
	return removed;
    };
};
