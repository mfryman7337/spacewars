var MenuController = function(engine) {
    var that = this;
	
    that.originalColor = $("#actions").css("background-color");
	that.originalModalColor = $("#modalAction").css("background-color");
    
    var callback = null;
    
    var cancelVerb = {
        show: function() { return true; },
        enabled: function() { return true; },
        shortcut: "q",
        action: function() {
            that.hide();
        }
    };
    
    that.hide = function() {
        $("#actions").addClass("hidden");
        if (callback != null && callback != undefined && typeof callback == "function") {
            callback();
        }
        
        // Remove all the click events attached to everything!
        $("#actions a").unbind("click");
        $(document).unbind("keydown", "a");
        $(document).unbind("keydown", "c");
        $(document).unbind("keydown", "f");
        $(document).unbind("keydown", "m");
		$(document).unbind("keydown", "q");
        $(document).unbind("keydown", "esc");
        
        callback = null;
		$("#actions").css("background-color", "none");
        engine.scroller.enable();
    }
    
    var createButton = function(verbName, verb, once) {
        // Skip this verb if it's not supposed to be shown (if verb.show is false).
        if (! verb.show()) return;
        // Default: only do this action once.
        if (once == undefined || once == null) {
            once = true;
        }
        
        // var $button = $('<a id="' + verbName + 'Action">' + verbName + "</a>");
        // See if the button already exists in the DOM
        var $button = $("#" + verbName + "Action", "#actions");
        if ($button.length == 0) {
            // Doesn't exist, eh? Create the button and add it to the DOM.
           $button = $('<a id="' + verbName + 'Action">' + verbName + "</a>");
            $(".buttons", "#actions").append($button);
        }
        
        // Make sure the button isn't hidden.
        $button.removeClass("hidden");
        
        // Okay, is this action enabled? Go do a bunch of stuff if so.
        if (verb.enabled()) {
            // Attach the action to the button's *next* click event.
            
            var doAction = function() {
                // Double-check at call time - what if the game state changes?
                if (verb.enabled() && verb.action != null && verb.action != undefined && typeof verb.action == "function") {
                    // have the TurnController get the current player and perform the action with the verb's action
                    if (verb != cancelVerb) {
                        engine.performAction(verb);
                    }
                    
                    // Hide the menu.
                    that.hide();
                } else {
                    $button.addClass("disabled");
                }
            };
            
            $button.bind("click", function() {
                doAction();
                // Unbind this action if we're only supposed to do it once!
                if (once) {
                    $button.unbind("click");
                }
            }).removeClass("disabled");
            
            // Bind the keyboard shortcut if specified (with a <strong> tag wrapped around a single key in the button).
            if (verb.shortcut != undefined && verb.shortcut != null) {
                $(document).bind("keydown", verb.shortcut, function() {
                    doAction();
                    
                    if (once) {
                        $(document).unbind("keydown");
                    }
                });
            }
            
        } else {
            // Show the button but disable it.
            $button.addClass("disabled");
        }
    }
    
    that.move = function(position) {
        // Calculate the menu position.
        position.x = Math.round(position.x - $("#actions").get(0).offsetLeft - $("#actions").width() / 2);
        position.y = Math.round(position.y - $("#actions").get(0).offsetTop);
        
        // Is this position we got okay?
        if (position.x < 32) {
            position.x = 32;
        } else if (position.x > engine.$container.width() - $("#actions").width() - 32) {
            position.x = engine.$container.width() - $("#actions").width() - 32;
        }
        
        if (position.y < 32) {
            position.y = 32;
        } else if (position.y > engine.$container.height() - $("#actions").height() - 32) {
            position.y = engine.$container.height() - $("#actions").height() - 32;
        }
        // Okay, cool, position it for reals.
        $("#actions").css("transform", "translate(" + position.x + "px, " + position.y + "px)");
    };
    
    that.show = function(options) {
        // verbs, position, showCallback, cancel, menuName, menuDesc
        var s = {
            color: that.originalColor,
            callback: null,
            cancel: true,
            position: { x: engine.$container.width() / 2, y: engine.$container.height() / 2 },
            name: "Actions",
            desc: "Choose an action.",
            verbs: {}
        }
        $.extend(s, options);
        
        // Hide before showing. Ensures reliable transitions between menus.
        that.hide();
        
        $("#actions").removeClass("tooltip").css("background-color", s.color);
		$("#actions .stats dd.colonize").css("background-color", s.color);
        
        // Display the Cancel button by default.
        // This is the rule, not the exception: there is only one menu (the main menu)
        // that should ever *not* use a Cancel button.
        
        callback = s.callback;
        
        // Don't do anything if there is a current menu already visible.
        // To do: support going back to previous menus. Hoo boy.
        if (! $("#actions").hasClass("hidden")) return;
        
        // Hide all current menu items / buttons from #actions (i.e. $("#actions")).
        $(".buttons a", "#actions").addClass("hidden");
        
        // Add these actions into the menu (and show the corresponding button, duh).
        for (var verb in s.verbs) {
            // Ignore inherited properties and ones named cancel (no remapping the Cancel button!)
            if (! s.verbs.hasOwnProperty(verb) || verb == "cancel") return;
            createButton(verb, s.verbs[verb]);
        }
        
        if (s.cancel) {
            // Make sure the cancel button still exists and does what it's supposed to.
            createButton("cancel", cancelVerb, false);
        }
        
        // Update the menu title and description.
        $("h1", "#actions").text(s.name);
        
        // Move the menu into position.
        that.move(s.position);
        
        // Additional keybindings
        $(document).bind("keydown", "esc", cancelVerb.action);
        
		var playerName = "Nobody";
		if (s.planet.owner != -1) {
			playerName = "Player " + s.planet.owner;
		}
		
		$("dd.colonize", "#actions").text(playerName);
		$("dd.colonize", "#actions").css("background-color", s.color);
		$("dd.fortify span.amount", "#actions").text(s.planet.troops);
		$("dd.fortify span.max", "#actions").text(s.planet.stationed_max);
		$("dd.mine span.amount", "#actions").text(s.planet.supply);
		$("dd.mine span.max", "#actions").text(s.planet.supply_max);
		
        // Okay, we're ready to go.
        $("#actions").removeClass("hidden");
        // Disable controls until the user does something with the damn menu!
        engine.scroller.disable();
    };
    
	that.showTooltip = function(options) {
        var s = {
			color: that.originalColor,
            position: { x: engine.$container.width() / 2, y: engine.$container.height() / 2 },
			planet: {},
			domElementString: "#actions"
        }
        $.extend(s, options);
		
        // Move the menu into position.
        that.move(s.position);
		
		$("h1", s.domElementString).text(s.planet.name);
		
		var playerName = "Nobody";
		if (s.planet.owner != -1) {
			playerName = "Player " + s.planet.owner;
		}
		$("dd.colonize", s.domElementString).text(playerName);
		$("dd.colonize", s.domElementString).css("background-color", s.color);
		$("dd.fortify span.amount", s.domElementString).text(s.planet.troops);
		$("dd.fortify span.max", s.domElementString).text(s.planet.stationed_max);
		$("dd.mine span.amount", s.domElementString).text(s.planet.supply);
		$("dd.mine span.max", s.domElementString).text(s.planet.supply_max);
		
		$(s.domElementString).addClass("tooltip").removeClass("hidden");
	};
	
    var init = function() {
        // Does the actions container even exist?
        // If not, who cares, we don't handle that.
        // Tell the programmer to not be stupid.
        if ($("#actions").length == 0) {
            throw "#actions doesn't exist in the DOM. Cannot initialize MenuController.";
            return;
        }
        
        // Make sure the actionsContainer is hidden.
        $("#actions").addClass("hidden");
		$("#modalAction").addClass("hidden");
    } ();
	
	var modalColonize = function(options) {
        var s = {
            color: that.originalModalColor,
            callback: null,
            cancel: true,
            // position: { x: engine.$container.width() / 2, y: engine.$container.height() / 2 },
            actionName: "colonize",
            desc: "Choose an action.",
        }
		
		$("#modalAction").removeClass("hidden");
	};
}
