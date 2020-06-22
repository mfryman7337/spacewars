var TooltipController = function() {
	var $container = $("#overlay");
	this.originalColor = $container.css("background-color");
}.method("resetColor", function() {
	$container.css("background-color", this.originalColor);
}).method("move", function(position) {
	if (position == undefined || position == null) {
		// Default position: center of the screen
		position = {
			x: $(document).width() / 2,
			y: $(document).height() / 2
		};
	}
	console.log(position);
	
}).method("show", function() {
	console.log(this.foo);
});
