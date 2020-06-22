//Player.js -- Russel Mommaerts, Joe Kohlmann, Zack Krejci, James Merrill
(function() {
	
	TurnController = function(engine) {
		
		this.engine = engine;
		this.players = [];
		this.playerIndex = 0;
		
		this.started = false;
        this.gameOver = false;
	};
	
	TurnController.prototype.addPlayer = function(player) {
		
		if (this.started) {
			throw "New players cannot be added after the game's started.";
		}
		
		this.players.push(player);
	};
	
	TurnController.prototype.startGame = function() {
		
		if (this.players.length < 2) {
			throw "There must be at least two players before the game can start.";
		}
		
		this.started = true;
		this.playerIndex = 0;
	};
	
	TurnController.prototype.beginTurn = function() {
		
		if (this.gameOver) {
            return;
        }
        
        //Allocate player resources
		//Create player military items
	    //console.log("Player " + this.players[this.playerIndex].id + "'s turn");
		var that = this;
        
		var player = this.getCurrentPlayer();

		this.engine.graph.visible (this.players[0]);

		for (var i = 0; i < this.players.length; i ++) {
		    this.engine.graph.zero (this.players[i]);
		    this.players[i].distributeResources();
		    this.players[i].createMilitary();
		}
		
		for (var i = 0; i < this.engine.graph.edges.length; i ++)
		    this.engine.graph.edges[i].color ();
		for (var i = 0; i < this.players.length; i ++) {
		    if (this.players[i].dirty) {
			this.players[i].boundary.reconfigure ();
		    }
		}
		for (var i = 0; i < this.players.length; i ++) {
		    this.players[i].boundary.add_arrows ();
		}
		
		//Could possibly create this in the constructor
		var callback = function(verb) {
			
		    //Send some stuff to the engine
		    setTimeout(function() {
			    that.engine.performAction(verb);
			}, !player.comp ? 0 : 1000);
		};
		
		this.players[this.playerIndex].beginTurn(callback);
	};
	
	TurnController.prototype.endTurn = function() {
		
		var previousPlayer = this.getCurrentPlayer();
        
        //Check every player for defeat this previous turn
        for (var i = 0; i < this.players.length; i++) {
            
            var player = this.players[i];
            
            if (player.checkDefeated()) {
                engine.messages.log(previousPlayer.string() + " defeated " + player.string() + " at " + player.lastPlanet.name, player.lastPlanet);
            }
        }
		
		// Check winning and losing conditions.
		if (this.players[0].isDefeated) {
        
            this.gameOver = true;
		    engine.lostTheGame();
		} 
        else {
        
            var enemyAlive = false;
            
            //Check if all enemies have been defeated
		    for (var i = 1; i < this.players.length; i++) {
                
                if (!this.players[i].isDefeated)
                    
                    enemyAlive = true;
                    break;
                }
            }
            
            if (!enemyAlive) {
                
                this.gameOver = true;
                engine.wonTheGame();
            }
		
        
        if (this.gameOver) {
            return;
        }
        
        //Otherwise look for the next un-defeated player
        while (true) {
            
            this.playerIndex = (this.playerIndex + 1) % this.players.length;
            
            if (!this.getCurrentPlayer().isDefeated) {
                break;
            }
        }
		
		// Show the wait cursor and stuff until it's the player's turn
		if (this.getCurrentPlayer().comp) {
			engine.$container.addClass("waitingForTurn");
			$("#waitingForPlayers").fadeIn(250);
		} else {
			engine.$container.removeClass("waitingForTurn");
			$("#waitingForPlayers").fadeOut(250);
		}
	};
	
	TurnController.prototype.getCurrentPlayer = function() {
		
		return this.players[this.playerIndex];
	};
	
})();