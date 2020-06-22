var EdgeScroller = function(engine, options) {
    engine.scroller = this;
    var that = this;
    
    var s = {
        panRadius: 64,
        maxSpeed: 1440,
        zoomSpeed: 1,
        debug: false
    };
    $.extend(s, options);
    
    var mX = 0;
    var mY = 0;
    var mZ = 0;

    var disabled = false;
    that.enable = function () {
        disabled = false;
    };
    that.disable = function () {
        disabled = true;
    };
    
    that.getWheelDelta = function() {
        return mZ;
    };
    
    var update = function() {
        // console.log("Moving", mX, mY);
        if (!disabled && ! engine.$container.hasClass("waitingForTurn")) {
            engine.camera.position.x += mX * engine.deltaTime;
            engine.camera.position.y += mY * engine.deltaTime;
            engine.camera.zoom(engine.camera.scale + mZ * engine.deltaTime);
        }
        
        // Prevents the scroll wheel from still doing its thing. It ended up being annoying.
        mZ = 0;
        
		// Arbitrarily hide the #actions menu if we're moving. That doesn't track with map panning.
		if ((mX != 0 || mY != 0 || mZ != 0) && ! disabled && ! engine.$container.hasClass("waitingForTurn")) {
			engine.menu.hide();
		}
		
        requestAnimationFrame(update);
    };
    
    var init = function() {
        // Show scroll zones for debugging purposes
        if (s.debug) {
            engine.$container.append('<div class="pan left"></div>');
            engine.$container.append('<div class="pan right"></div>');
            engine.$container.append('<div class="pan top"></div>');
            engine.$container.append('<div class="pan bottom"></div>');
        }
        
        engine.$container.mousemove(function(e) {
            mX = 0;
            mY = 0;
            mZ = 0;
            
            var mXAdds = 0;
            var mYAdds = 0;
            
            var cursorName = "auto";
            
            var rX = e.pageX - this.offsetLeft;
            var rY = e.pageY - this.offsetTop;
            
            // Default Vertical Movement
            if (rY <= s.panRadius) {
                mY += (s.panRadius - rY) / s.panRadius * s.maxSpeed;
                mYAdds++;
            } else if (rY >= $(this).height() - s.panRadius) {
                mY += ($(this).height() - s.panRadius - rY) / s.panRadius * s.maxSpeed;
                mYAdds++;
            }
            
            // Proportional Horizontal Movement
            if (rY <= s.panRadius || rY >= $(this).height() - s.panRadius) {
                if (rX <= $(this).width() * 0.25) {
                    mX += (rX - $(this).width() * 0.25) / ($(this).width() * 0.25) * s.maxSpeed;
                    mXAdds++;
                    // console.log("Moving Left by", mX);
                } else if (rX >= $(this).width() * 0.75) {
                    mX += (rX - $(this).width() * 0.75) / ($(this).width() * 0.25) * s.maxSpeed;
                    mXAdds++;
                    // console.log("Moving Right by", mX);
                }
            }
            
            // Default Horizontal Movement
            if (rX <= s.panRadius) {
                mX += (rX - s.panRadius) / s.panRadius * s.maxSpeed;
                mXAdds++;
            } else if (rX >= $(this).width() - s.panRadius) {
                mX += (rX - $(this).width() + s.panRadius) / s.panRadius * s.maxSpeed;
                mXAdds++;
            }
            
            // Proportional Vertical Movement
            if (rX <= s.panRadius || rX >= $(this).width() - s.panRadius) {
                if (rY <= $(this).height() * 0.25) {
                    mY += ($(this).height() * 0.25 - rY) / ($(this).height() * 0.25) * s.maxSpeed;
                    mYAdds++;
                    // console.log("Moving Up by", mY);
                } else if (rY >= $(this).height() * 0.75) {
                    mY += ($(this).height() * 0.75 - rY) / ($(this).height() * 0.25) * s.maxSpeed;
                    mYAdds++;
                    // console.log("Moving Down by", mY);
                }
            }
            
            // Averages
            if (mXAdds > 0) {
                mX /= mXAdds;
            }
            if (mYAdds > 0) {
                mY /= mYAdds;
            }
            
            if (s.debug) {
                console.log("mX", mX, "mY", mY, "mXAdds", mXAdds, "mYAdds", mYAdds);
            }
            
            if (disabled || engine.$container.hasClass("waitingForTurn")) {
                cursorName = "auto";
            } else {
                if (mX < 0 && mY == 0) {
                    cursorName = "w-resize";
                } else if (mX > 0 && mY == 0) {
                    cursorName = "e-resize";
                } else if (mX == 0 && mY < 0) {
                    cursorName = "s-resize";
                } else if (mX == 0 && mY > 0) {
                    cursorName = "n-resize";
                } else if (mX < 0 && mY < 0) {
                    cursorName = "sw-resize";
                } else if (mX < 0 && mY < 0) {
                    cursorName = "sw-resize";
                } else if (mX < 0 && mY > 0) {
                    cursorName = "nw-resize";
                } else if (mX > 0 && mY < 0) {
                    cursorName = "se-resize";
                } else if (mX > 0 && mY > 0) {
                    cursorName = "ne-resize";
                } else {
                    cursorName = "auto";
                }
            }
            
            engine.$container.css("cursor", cursorName);
        }).mouseleave(function() {
            mX = 0;
            mY = 0;
            mZ = 0;
        
            engine.$container.css("cursor", "auto");
        }).mousewheel(function(e, delta) {
			// Hide the tooltip.
			if (! disabled && ! engine.$container.hasClass("waitingForTurn")) {
				engine.menu.hide();
			}
			
            mZ = 0;
            // console.log("Moving mouse wheel, delta =", delta);
            if (delta > 0) {
                mZ = delta * s.zoomSpeed;
            } else if (delta < 0) {
                mZ = delta * s.zoomSpeed;
            } else {
                mZ = 0;
            }
        });
        
        update();
    } ();
	
	// Arrow Keys for Panning
	$(document).bind("keydown", "left", function() {
		mX = -1080;
	}).bind("keyup", "left", function() {
		mX = 0;
	});
	
	$(document).bind("keydown", "right", function() {
		mX = 1080;
	}).bind("keyup", "right", function() {
		mX = 0;
	});
	
	$(document).bind("keydown", "up", function() {
		mY = 1080;
	}).bind("keyup", "up", function() {
		mY = 0;
	});
	
	$(document).bind("keydown", "down", function() {
		mY = -1080;
	}).bind("keyup", "down", function() {
		mY = 0;
	});
	
	// PageDn/PageUp & -/= for Zooming
	$(document).bind("keydown", "pagedown", function() {
		mZ = -2;
	}).bind("keyup", "down", function() {
		mZ = 0;
	});
	
	$(document).bind("keydown", "pageup", function() {
		mZ = 2;
	}).bind("keyup", "down", function() {
		mZ = 0;
	});
	
	$(document).bind("keydown", "-", function() {
		mZ = -2;
	}).bind("keyup", "down", function() {
		mZ = 0;
	});
	
	$(document).bind("keydown", "=", function() {
		mZ = 2;
	}).bind("keyup", "down", function() {
		mZ = 0;
	});

};
