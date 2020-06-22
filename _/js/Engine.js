var Engine = function(options) {
	var s = {
		generator: MapGenerator.generateSpiral,
		hints: true,
		mapSize: 1
	};
	$.extend(s, options);
	
    var that = this;

    this.canvas = $ ('<canvas></canvas>');
    this.canvas2d = $ ('<canvas></canvas>');
    this.canvas.attr ('width', $ (document).width ());
    this.canvas.attr ('height', $ (document).height ());
    this.canvas2d.attr ('width', $ (document).width ());
    this.canvas2d.attr ('height', $ (document).height ());
    this.canvas2d.css ('position', 'absolute');
    this.canvas2d.css ('left', '0px');
    this.canvas2d.css ('top', '0px');
    /*function throwOnGLError(err, funcName, args) {
        throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" + funcName;
};
this.gl = WebGLDebugUtils.makeDebugContext($(this.canvas).get (0).getContext ('experimental-webgl'), throwOnGLError);*/
    this.gl = $ (this.canvas).get (0).getContext ('experimental-webgl');
    setContext (this.gl);
    this._2d = this.canvas2d.get (0).getContext ('2d');
    this.gl.enable (this.gl.BLEND);
    $("#container").append (this.canvas);
    $("#container").append (this.canvas2d);
    this.camera = new Camera (this.canvas);
        // Initialize the camera zoom to be further out.
        this.camera.zoom(0.5);
    this.scene = [];
    this.$container = $ ('#container');
    
    (function (gl) {
    gl.blendFunc (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable (gl.BLEND);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    }) (this.gl);
    
    var old_time =  new Date ().getTime ();
    that.deltaTime = 0;

    that.messages = new MessageQueue ();
    
    // Menus
    that.menu = new MenuController(that);
    
    // Make our mapuniform float zoom;


    that.graph = new PlanetGraph(that);
    MapGenerator.generate(that.graph, s.mapSize);
	
    // Create the turn controller
    that.turnController = new TurnController(that);
    
    //Create our players
    var humanHome = that.graph.takeHomePlanet();
    var humanPlayer = new Player(that, that.graph, humanHome, false);
    //var humanBoundary = new Boundary (this, humanPlayer, humanHome);
    //humanPlayer.boundary = humanBoundary;
    //that.scene.splice (1, 0, humanBoundary);
    that.turnController.addPlayer(humanPlayer);
    
    //Center on the human player's planet. Use setTimeout as just setting was causing issues with text     
    that.centerCamera = function() {
        that.camera.position.x = humanHome.position.x;
        that.camera.position.y = humanHome.position.y;
    } ();
	
    //Center on the human player's planet. Use setTimeout as just setting was causing issues with text     
    that.centerCameraOnPlanet = function(planet) {
		if (planet == null || planet == undefined) {
			return;
		}
		
		console.log("Centering camera on planet \"" + planet.name + "\"");
		
        that.camera.position.x = planet.position.x;
        that.camera.position.y = planet.position.y;
		that.camera.zoom(0.5);
    };

    
    //Create the AI players
    for (var i = 1; i < that.graph.maxPlayers; i++) {
        that.turnController.addPlayer(new Player(that, that.graph, that.graph.takeHomePlanet(), true));
    }
    
    that.turnController.startGame();
    that.turnController.beginTurn();
    
    // Update text labels for the players, I think?
    for (var i = 0; i < that.turnController.players.length; i++) {
        that.graph.update_text(that.turnController.players[i]);
    }
    
    that.getCurrentPlayer = function() {
        return that.turnController.getCurrentPlayer();
    };
	
    that.performAction = function(verb) {
        // if (action == PlayerAction.buildEdge) {
        //     buildEdge(player, params.edge, params.planet);
        // }
        
        // Should we even be allowed to do this action?
        if (verb.enabled() && verb.action != null && verb.action != undefined && typeof verb.action == "function") {
            // Okay, do the action
            verb.action();
        } else {
            throw "Attempting to perform verb that isn't enabled right now.";
        }
        // Okay, did that, end the turn.
        that.turnController.endTurn();
		
        // Anything that needs to happen between turns
        
        that.turnController.beginTurn();
    };

    var fps_window = [];

    var framebuffer = gl.createFramebuffer ();
    gl.bindFramebuffer (gl.FRAMEBUFFER, framebuffer);
    framebuffer.width = 512;
    framebuffer.height = 512;
    
    var tex = gl.createTexture ();
    gl.bindTexture (gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);  
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);  
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebuffer.width, framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);


    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var stars = new Stars (that);
    
    var update = function () {
        var current_time = new Date ().getTime ();
        that.deltaTime = (current_time - old_time) / 1000;
        if (fps_window.length >= 60)
            fps_window.splice (0, 1);
        fps_window.push (that.deltaTime);
        var fps = 0;
        for (var i = 0; i < fps_window.length; i ++) {
            fps += fps_window[i];
        }
        fps /= fps_window.length
        $ ('#fps').text (Math.floor (1 / fps));
        old_time = current_time;
        that.gl.clear(that.gl.COLOR_BUFFER_BIT);
        //that.gl.clearDepth (0);
        that._2d.clearRect (0, 0, that.canvas2d.width (), that.canvas2d.height ());
	//gl.enable (gl.DEPTH_TEST);
        //that.gl.depthFunc (gl.ALWAYS);
        
	/*gl.bindFramebuffer (gl.FRAMEBUFFER, framebuffer);
        that.gl.blendFunc (that.gl.SRC_ALPHA, that.gl.ONE);
        that.gl.clear(that.gl.COLOR_BUFFER_BIT);
        that.graph.draw_visible (that.gl);

        gl.bindFramebuffer (that.gl.FRAMEBUFFER, null);
        that.gl.blendFunc (that.gl.SRC_ALPHA, that.gl.ONE_MINUS_SRC_ALPHA);*/

        that.gl.clear(that.gl.COLOR_BUFFER_BIT);

        stars.draw (gl);
        for (var i = 0; i < that.scene.length; i ++) {
            that.scene[i].draw (that.gl, tex);
        }

        //stars.draw (gl, tex);
        requestAnimationFrame(update);
    };
    
    update ();
	
	// Help Hint Hooks
	that.startedGame = false;
	that.firstColony = false;
	that.firstMine = false;
	that.firstDepletion = false;
	that.firstFortification = false;
	that.firstFullFortification = false;
	that.firstAttackWin = false;
	that.firstAttackLoss = false;
	that.firstEnemyDefeat = false;
};
