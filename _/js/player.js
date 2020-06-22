//Player.js -- Russel Mommaerts, Joe Kohlmann, Zack Krejci, James Merrill

(function() {

    var user = 1;
    
    //Mining constants
    var mineValue = 3;     //How much planets directly connected to a mining planet receive
    var mineDecay = 0.5;    //The percent of resources that continue to following planets
    var mineRange = 3;      //How many planets away a mining planet can reach
    
    //Troop Constants
    var troopPerSupply = 1; //How many troops can be generated per supply point
    var troopRange = 3;     //How many planets away a base can send units
    var troopDecay = 0.5;   //What percent of troops flow to an adjacent planet
    
    var pulledColor = false;    //We always give away green first (Cheap hack to give to human)
    
    var colors = [
	[0, 0.4, 0.8],   // Lighter Blue
        [0, .8, 0], // Green
        [0.3, 0, 0.7],  //Purple
        [0.9, 0, 0.9],  //Pink
        [0.80, 0, 0],   //Red
        [0, 0, 0.80],   //Blue
        [1, 0.55, 0],   //Orange
        [1, 0.7, 0],    //Gold
        [.5, 1, .83]    //Teal
    ];
    
    var takeColor = function() {
        
        var index;
        
        if (!pulledColor) {
            
            index = 0;
            pulledColor = true;
        }
        else {
            index = Math.floor(Math.random() * colors.length);
        }
        
        var toReturn = colors[index];
        
        colors.splice(index, 1);
        return toReturn;
    };
    
    //Unvisits an array
    var unvisitArray = function(visited) {
        
        for (var i = 0; i < visited.length; i++) {          
            visited[i].visited = false;
        }
    }
    
    Player = function(engine, graph, home, comp) {
		this.home = home;
		this.id = user;
		user ++;
        
        this.color = takeColor();
		
		this.active = false;
		this.isTurn = false;
		this.turnCallback = null;
        
        this.mining = [];
		this.military = [];
        this.planets = [];
        this.edges = [];
		this.dirty = true;

		this.graph = graph;
        this.comp = comp;

		this.home.claim(this);
		this.isDefeated = false;
        this.lastPlanet = null;
		
		engine.messages.log (this.string () + ' started the game at ' + this.home.name, this.home);
		
		if (! this.comp && ! engine.startedGame) {
			$("#exploringAndActing").removeClass("hidden");
			engine.startedGame = true;
		}
		
		this.boundary = new Boundary (engine, this);
		engine.scene.push (this.boundary);
    };
    
    //Checks if the player has just been defeated and sets the isDefeated flag
    Player.prototype.checkDefeated = function() {
        
        if (this.isDefeated) {
            return false;
        }
        
        this.isDefeated = this.planets.length == 0;
        return this.isDefeated;
    };
    
    //Removes a planet from the player
    //  planet: The planet to remove
    Player.prototype.removePlanet = function(planet) {
        
        if (planet.military) {         
            this.military.remove(planet);
        }   
        else if (planet.mining) {
            this.mining.remove(planet);
        }
        
        this.planets.remove(planet);
        
        //Remove any edges that also point to this planet
        for (var i = this.edges.length - 1; i >= 0; i--) {
            
            var edge = this.edges[i];
            
            if (edge.u == planet || edge.v == planet) {           
                this.edges.remove(edge);
            }
        }
        
        //If we're removing the player's last planet, hold
        //onto it so we can say where they were defeated
        if (this.planets.length == 0) {
            this.lastPlanet = planet;
        }
    };

	//Indicates to the player that it is their turn.
	//	callback: This function must be called when the player's turn is finished.
	Player.prototype.beginTurn = function(callback) {
	    var that = this;
	    this.isTurn = true;
	    this.turnCallback = callback;
        
	    if (this.comp) {
        
            //If all else fails, do nothing
            var verb = dummyVerb = {
                show: function() { return true; },
                enabled: function() { return true; },
                action: function() {
					engine.messages.log(that.string() + " skipped a turn", that.home);
				    console.log("Computer Player " + that.id + " has nowhere to go. Please fix me!!!");
				}
			};
            
            var foundVerb = false;
            
            //Try to keep about half our bases as mining, 25% as forts

	    var weakest = null;
	    var weakest_num = -Infinity;
	    for (var i = 0; i < this.planets.length; i ++) {
		for (var j = 0; j < this.planets[i].neighbors (); j ++) {
		    if (this.planets[i].troops > 0) {
			if (this.planets[i].next (j).owner != this.id && this.planets[i].next (j).owner != -1) {
			    if (this.planets[i].troops - this.planets[i].next (j).troops > weakest_num) {
				weakest_num = this.planets[i].troops - this.planets[i].next (j).troops;
				weakest = this.planets[i].next (j);;
			    }
			}
		    }
		}
	    }
	    
	    if (weakest_num > 1) {
		verb = weakest.verbs.attack;
		foundVerb = true;
	    }
	    if (!foundVerb) {
		for (var i = 0; i < this.military.length; i ++) {
		    if (this.military[i].supply < 2) {
			for (var j = 0; j < this.military[i].neighbors (); j ++) {
			    var v = this.military[i].next (i);
			    if (v.owner == this.id && !v.military && !v.mining) {
				verb = v.verbs.mine;
				foundVerb = true;
			    }
			}
		    }
		}
	    }
	    if (!foundVerb) {
		for (var i = 0; i < this.planets.length; i ++) {
		    for (var j = 0; j < this.planets[i].neighbors (); j ++) {		
			var v = this.planets[i].next (j);
			if (v.owner != this.id && v.owner != -1) {
			    if (!this.planets[i].military && !this.planets[i].mining) {
				verb = this.planets[i].verbs.fortify;
				foundVerb = true;
			    }
			}
		    
		    }
		}
	    }
            /*if (!foundVerb) {

                //Try for 25% forts

		if (this.military.length == 0 || (this.military.length / this.planets.length) < 0.25) {
		    
		    //Make a random base military
		    while (true) {
			
			var target = this.planets[Math.floor(Math.random() * this.planets.length)];
			
			if (target.verbs.fortify.enabled()) {
			    
			    verb = target.verbs.fortify;
			    foundVerb = true;
			    break;
			}
		    }
		}
		else if (this.mining.length == 0 || (this.mining.length / this.planets.length) < 0.5) {
		    
		    //Make a random base mining
		    while (true) {
			
			var target = this.planets[Math.floor(Math.random() * this.planets.length)];
			
			if (target.verbs.mine.enabled()) {
			    
			    verb = target.verbs.mine;
			    foundVerb = true;
			    break;
			}
		    }
		}
	    }*/
            
            if (!foundVerb) {
                //Do BFS and just expand outwards
                var toColonize = null;
                var targetEdge = null;
                
                this.graph.unvisit();
                var queue = new Queue();
                
                this.home.visited = true;
                queue.enqueue(this.home);
                
                while (!queue.isEmpty() && toColonize == null) {
                    
                    var planet = queue.dequeue();
                    
                    for (var i = 0; i < planet.edges.length; i++) {
                        
                        var next = planet.next(i);
                        
                        //See if this planet can be colonized by us
                        if (!next.isOwned()) {
                            
                            toColonize = next;
                            targetEdge = planet.edge(i);
                            break;
                        }
                        
                        if (!next.visited && next.owner == this.id) {
                            queue.enqueue(next);
                            next.visited = true;
                        }
                    }
                }
                
                if (toColonize != null) {
                    verb = toColonize.verbs.colonize;
                }
                else {
                    
                    var tries = 25;
                    
                    //Look for someone to attack
                    while (tries > 0) {
                        
                        var target = this.graph.vertices[Math.floor(Math.random() * this.graph.vertices.length)];
                        
                        if (target.verbs.attack.enabled()) {
                            verb = target.verbs.attack;
                            break;
                        }
                        
                        tries--;
                    }
                }
            }
            
            this.performAction(verb);
	    }
	};
    
    //Distributes the supply to the player's planets
    Player.prototype.distributeResources = function() {

	//Clear the edge supplies from last turn so the colors show correctly
        for (var i = 0; i < this.edges.length; i++) {
            this.edges[i].supply = 0;
        }
        
        for (var i = 0; i < this.mining.length; i++) {
            
            unvisitArray(this.planets);
            unvisitArray(this.edges);
            
            //Perform BFS outward to distribute resources
            var queue = new Queue();
			
	    var supplyTurns = this.mining[i].supply_turns;
	    if (supplyTurns <= 0) {
			this.mining[i].supply_turns = 0;
			
			// Display a message if this is the first turn where this mining planet is depleted.
			if (! this.mining[i].depleted) {
				var playerName = this.mining[i].ownerPlayer.string ();
				if (playerName == "You") {
					playerName = "Your";
				} else {
					playerName += "'s";
				}
				engine.messages.log (playerName + " mining planet " + this.mining[i].name + " has been depleted!", this.mining[i]);
				this.mining[i].depleted = true;
			}
			continue;
	    }
			
            var supply = mineValue;     //TODO: Get this from the planet, and make different per planet
            
            var start = this.mining[i];
			start.supply = mineValue;
            
            start.bfsDepth = 0;
            start.visited = true;
            
            queue.enqueue(start);
            
            while (!queue.isEmpty()) {
                
                var planet = queue.dequeue();
                
                for (var iNeighbor = 0; iNeighbor < planet.neighborPlanets.length; iNeighbor++) {

                    var neighbor = planet.neighborPlanets[iNeighbor];
                    var edge = planet.edge(iNeighbor);
                   
                    if (!edge.visited) {
                    
                        edge.supply += (mineRange - planet.bfsDepth);
                        edge.visited = true;
                    }
            
                    if (neighbor.ownerPlayer == this && !neighbor.visited) {
                        
                        //We can just use BFS for depth for pow because planets one away from mining should get
                        //supply * decay^0, two away should get supply * decay^1, etc. Only supply military bases
                        //if (neighbor.military) {
						neighbor.supply += (supply * Math.pow(mineDecay, planet.bfsDepth));
						//}
                        
                        neighbor.visited = true;
                        
                        var newDepth = planet.bfsDepth + 1;
                        
                        //Don't add anything out of range
                        if (newDepth < mineRange) {
                        
                            neighbor.bfsDepth = newDepth;
                            queue.enqueue(neighbor);
                        }
                    }
                }
            }
			// All done, so decrement the number of turns remaining for this planet to supply resources.
			this.mining[i].supply_turns--;
        }
    };
    
    //Creates the player's military units

    Player.prototype.createMilitary = function() {

        for (var i = 0; i < this.military.length; i++) {

            var militaryPlanet = this.military[i];
            
            var newTroops = Math.floor(militaryPlanet.supply / troopPerSupply);
            //militaryPlanet.supply -= newTroops * troopPerSupply;
            
            militaryPlanet.stationed += newTroops;
			
	    // Cap the number of troops that can be stationed 
	    if (militaryPlanet.stationed > militaryPlanet.stationed_max) {
		militaryPlanet.stationed = militaryPlanet.stationed_max;
	    }

	    militaryPlanet.troops += militaryPlanet.stationed;
	    var troops = militaryPlanet.troops;
            
            //Use BFS to distribute troops
            unvisitArray(this.planets);
            
            var queue = new Queue();
            
            militaryPlanet.visited = true;
            militaryPlanet.bfsDepth = 0;
            queue.enqueue(militaryPlanet);
            
            while (!queue.isEmpty()) {
                
                var planet = queue.dequeue();
                
                for (var iNeighbor = 0; iNeighbor < planet.neighborPlanets.length; iNeighbor++) {
                    var neighbor = planet.neighborPlanets[iNeighbor];

                    if (neighbor.ownerPlayer == this && !neighbor.visited) {
                        
                        //We need to use depth + 1 because planets one edge away should receive troops * decay^1
			var addTroops = Math.floor(troops * Math.pow(troopDecay, planet.bfsDepth + 1));
                        neighbor.troops += addTroops;
                        neighbor.contrib.push (militaryPlanet);
			
                        neighbor.visited = true;
                        var newDepth = planet.bfsDepth + 1;
                        
                        //Don't add anything out of range
                        if (newDepth < troopRange) {
                        
                            neighbor.bfsDepth = newDepth;
                            queue.enqueue(neighbor);
                        }
                    }
                }
            }
        }
        
        this.graph.update_text(this);
    };
	
	//Performs an action for the passed player. This concludes a player's turn
	//	verb: The verb object that the player will perform.
	Player.prototype.performAction = function(verb) {
		
		//For things like defense we might need to do an additional check,
		//since the defend action is legal even while not your turn
		if (!this.isTurn) {
			throw "Player cannot perform actions while it is not their turn";
		}
		
		this.turnCallback(verb);
		this.turnCallback = null;
		
		this.isTurn = false;
	};
    

	Player.prototype.activateControls = function() {
		
		this.active = true;
	};

	Player.prototype.disableControls = function() {
		
		this.active = false;
	};
	Player.prototype.hasBoundary = function() {
	    return ('boundary' in this);
	};

	Player.prototype.string = function() {
	    if (!this.comp)
		return 'You';
	    else
		return 'Player ' + this.id;
	};
})();
