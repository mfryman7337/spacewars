function World (engine) {
    // var graph = new PlanetGraph (engine);
    // var generator = MapGenerator (graph, 2000, 2000);
    // 
    // var turnController = new TurnController(this);
    // 
    // //Create our players
    // var humanPlayer = new Player(graph, graph.takeHomePlanet(), false);
    // turnController.addPlayer(humanPlayer);
    // 
    // //Create the AI players
    // for (var i = 1; i < graph.maxPlayers; i++) {
    //     turnController.addPlayer(new Player(graph, graph.takeHomePlanet(), true));
    // }
    // 
    // turnController.startGame();
    // turnController.beginTurn();
    // 
    // // Update text labels for the players?
    // for (var i = 0; i < turnController.players.length; i++) {
    //     graph.update_text(turnController.players[i]);
    // }
    
    function buildEdge(player, edge, targetPlanet) {
        edge.claim (player);
        targetPlanet.claim (player);
        graph.update (player);
        select (null);
    }
    
    var selected = null;
    
    function select (v) {
        if (selected) {
            selected.unselect ();
            selected = null;
        }
        if (v) {
            selected = v;
            selected.select ();
        }
    };
    
    // THIS IS USER INTERFACE CODE. 
    var current_hover = null;
    $ ('#container').mousemove (function (event) {
	    console.log ('move');
	    var x = 2.0 * event.pageX / $ (document).width () - 1.0;
	    var y = -(2.0 * event.pageY / $ (document).height () - 1.0);
	    var pos = engine.camera.project (new vect (x, y));
	    var v = graph.select_planet (pos);
	    if (current_hover)
		current_hover.unhover ();
	    v.hover ();
	    current_hover = v;
	});
    $ ('#container').click (function (event) {
        var x = 2.0 * event.pageX / $ (document).width () - 1.0;
        var y = -(2.0 * event.pageY / $ (document).height () - 1.0);
        var pos = engine.camera.project (new vect (x, y));
        var v = graph.select_planet (pos);
    
        if (!v) {
            select (null);
            return;
        }
        if (!selected) {
            select (v);
        }
        else {
            var currentPlayer = turnController.getCurrentPlayer();
        
            var in_network = graph.in_network (currentPlayer, selected);
            if (!in_network) {
                select (v);
            }
            else {
                var edge = selected.get_edge (v);
                if (edge && v.owner == -1) {
                    currentPlayer.performAction(PlayerAction.buildEdge, { edge: edge, planet: v });
                }
                else {
                    select (v);
                }
            }
        }
    });
    
    // Mine the selected planet when pressing the "M" key
    $(document).bind('keydown', 'm', function(event) {
        if (selected) {
            if (selected.verbs.mine.enabled()) {
                selected.verbs.mine.action();                    
            }
        }
    });
    
    // Fortify the selected planet when pressing the "F" key
    $(document).bind('keydown', 'f', function(event) {
        if (selected) {
            if (graph.in_network (player, selected) && !selected.mining) {
                //selected.text ('0');
                selected.military = true;
                player.military.push (selected);
                graph.update(player);
            }
        }
    });
    
    // Add military units (reinforce) on the selected planet when pressing the "r" key
    $(document).bind('keydown', 'r', function(event) {
        graph.add_military(player);
        graph.update(player);
    });
};