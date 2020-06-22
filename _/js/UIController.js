function UIController(engine) {
    engine.ui = this;
    
    var that = this;
    
    var disabled = false;
    that.enable = function () {
        disabled = false;
    };
    that.disable = function () {
        disabled = true;
    };
    
    function buildEdge(player, edge, targetPlanet) {
        edge.claim (player);
        targetPlanet.claim (player);
        graph.update (player);
        select (null);
    }
    
    that.selected = null;
    var current_hover = null;
    
    function select (v) {
        // if (that.selected) {
        //     that.selected.unselect ();
        //     that.selected = null;
        // }
        if (v) {
            that.selected = v;
            that.selected.select ();
        } else if (that.selected) {
            that.selected.unselect ();
            that.selected = null;
        }
    };
    
    // Handle mouse events and perform actions based on mouse movement and clicks.
    // Disabled when the UIController is not enabled.
    $ ('#container').mousemove (function (event) {
        if (disabled || engine.getCurrentPlayer().comp) return;
        
		if ($("#actions").hasClass("hidden")) {
			that.selected = null;
		}
		
        var x = 2.0 * event.pageX / $ (document).width () - 1.0;
        var y = -(2.0 * event.pageY / $ (document).height () - 1.0);
        var pos = engine.camera.project (new vect (x, y));
        var v = engine.graph.select_planet (pos);
        if (current_hover) {
            current_hover.unhover();
			current_hover = null;
			// if (! that.selected) {
			// 	engine.menu.hide();
			// }
        }
        if (v && v.visible) {
            v.hover ();
            current_hover = v;
			// if (! that.selected) {
			// 	current_hover.verbs.displayTooltip.action();
			// }
        }
		// Don't hover if invisible according to fog
		if (current_hover) {
			// console.log(that.selected);
			if (that.selected == null) {
				if (current_hover.visible) {
					current_hover.verbs.displayTooltip.action();
				}
			} else {
				// Do nothing
			}
		} else {
			if (that.selected == null) {
				engine.menu.hide();
			}
		}
		
    }).click (function (event) {
        if (disabled || engine.getCurrentPlayer().comp) return;
        
        var x = 2.0 * event.pageX / $ (document).width () - 1.0;
        var y = -(2.0 * event.pageY / $ (document).height () - 1.0);
        var pos = engine.camera.project (new vect (x, y));
        var v = engine.graph.select_planet (pos);
        
        // Don't allow a click on a planet that's already that.selected.
        if (v == that.selected && ! $("#actions").hasClass("hidden")) {
            return;
        }
        // Don't select if invisible according to fog
        if (v && v.visible) {
            select(v);
				if (that.selected.visible) {
					that.selected.verbs.displayMenu.action();
				}
        } else {
            select();
			engine.menu.hide();
        }
    });
};
