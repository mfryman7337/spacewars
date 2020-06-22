if (!('console' in window)) {
    console = {
        log: function () {},
        error: function () {}
    }
}

$(document).ready(function() {
	// Main menu and hiding various things
    $("#help").fadeOut(0);
	$("#helpButton").fadeOut(0);
	$("#waitingForPlayers").fadeOut(0);
	$("#messageQueue").fadeOut(0);
	$("#skipTurnButton").fadeOut(0);
	$("#mainMenu").fadeIn(250);
	
	$("#engineInit").click(function() {
		$("#mainMenu").fadeOut(250);
		var mapSize = parseInt($("#engineOptions #mapSize").attr("value"));
		var showHints = parseInt($("#engineOptions #mapSize").attr("checked"));
		if (showHints == undefined) {
			showHints = false;
		} else {
			showHints = true;
		}
		
		options = {
			hints: showHints,
			mapSize: mapSize
		};
		
		initEngineAndEverything(options);
	});
	
	var initEngineAndEverything = function(options) {
	    // General Everything
	    engine = new Engine(options);
	    // Edge Scrolling
	    var scroller = new EdgeScroller(engine);
	    // Clicks and keyboard presses
	    var ui = new UIController(engine);
    
	    // Help message!
	    // Load the messages (help, won and lost) into the current <body>
	    $.get("messages.html", function(data){
	        // Append the body contents into the current document's body
	        $(data).appendTo("body");
			
	        var startTheGame = function(time) {
				if (time == null || time == undefined) {
					time = 250;
				}
	            $("#help").fadeOut(time);
	            $("#helpButton").fadeIn(time);
				$("#waitingForPlayers").fadeOut(time);
				$("#messageQueue").fadeIn(time);
				$("#skipTurnButton").fadeIn(time);
	            engine.scroller.enable();
	            engine.ui.enable();
	        };
        
	        var pauseTheGame = function() {
	            $(document).bind("keydown", "return", startTheGame);
	            $(document).bind("keydown", "esc", startTheGame);
            
	            engine.scroller.disable();
	            engine.ui.disable();
	        };
        
	        // Initialization: Show the help menu and disable scrolling.
            $("#help").fadeIn(250);
            $("#helpButton").fadeOut(250);
            pauseTheGame();
        
	        // When clicking the needHelp button, 
	        $("#helpButton").fadeOut(0).click(function() {
	            $("#help").fadeIn(250);
	            $("#helpButton").fadeOut(250);
	            pauseTheGame();
	        });
        
	        $("#bigHelpStartGame").click(startTheGame);
	    });
	
		var messageQueueCollapsed = false;
	
		$("#messageQueue h1").click(function() {
			$("#messageQueue").toggleClass("collapsed");
		});
	
		engine.wonTheGame = function() {
			$("#actions").fadeOut(0);
			$("#lost").fadeOut(0);
			$("#stalemate").fadeOut(0);
			$("#won").fadeIn(250);
	        engine.scroller.disable();
	        engine.ui.disable();
		};
	
		engine.lostTheGame = function() {
			$("#actions").fadeOut(0);
			$("#won").fadeOut(0);
			$("#stalemate").fadeOut(0);
			$("#lost").fadeIn(250);
	        engine.scroller.disable();
	        engine.ui.disable();
		};
		
		engine.stalemateGame = function() {
			$("#actions").fadeOut(0);
			$("#won").fadeOut(0);
			$("#lost").fadeOut(0);
			$("#stalemate").fadeIn(250);
	        engine.scroller.disable();
	        engine.ui.disable();
		};
		
		var skipTurnVerb = {
			show: function() { return false; },
			enabled: function() { return true; },
			action: function() {
				engine.messages.log(engine.getCurrentPlayer().string() + " skipped a turn", engine.getCurrentPlayer().home);
				return;
			}
		};
		
		var actuallySkipTurn = function() {
			if (engine.getCurrentPlayer().comp) return;
			engine.performAction(skipTurnVerb);
		};
		
		$("#skipTurnButton").click(actuallySkipTurn);
		
		$(document).bind("keydown", "space", actuallySkipTurn);
	}
});
