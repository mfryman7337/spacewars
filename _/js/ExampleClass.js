// Example class with various JavaScript programming conventions I like using.
var ExampleClass = function(options) {
	var that = this;
	
	// Default settings for this object
	var s = {
		foo: "bar"
	}
	// Merge default settings with the options given at creation time.
	$.extend(s, options);
	
	// that.foo is publicly accessible, s.foo is secret...ssh.
	that.foo = s.foo;
	
	// Do interactive things and have requestAnimationFrame() call it for us.
	var update = function() {
		requestAnimationFrame(update);
	}
	
	// Place (most) init code in here so it's easy to find and not all over.
	var init = function() {
		// Kickstart the update() function.
		update();
	} (); // Call the init function we just closed.
}
