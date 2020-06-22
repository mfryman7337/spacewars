function MessageQueue () {
    var messages = [];
    this.log = function (string, targetPlanet) {
		var messageColor = "transparent";
		
		if (targetPlanet != undefined && targetPlanet != null) {
			messageColor = targetPlanet.getPlanetColor(null, "rgba");
		}
		
		console.log (string);
		messages.push (string);
		$("<p>" + string + "</p>").attr("title", "Click to center the map on the planet " + targetPlanet.name).css("background-color", messageColor).click(function() {
			engine.centerCameraOnPlanet(targetPlanet);
			targetPlanet.verbs.displayTooltip.action();
		}).mousemove(function(e) {
			e.stopPropagation();
		}).appendTo("#messageQueue .content");
		// Scroll the content downwards
		$("#messageQueue .content").animate({ scrollTop: $("#messageQueue .content").prop("scrollHeight") }, 250);
		
    };

    this.out = function () {
	if (messages.length <= 0)
	    throw "No message to dequeue";
	return messages.splice (0, 1)[0];
    };

    this.count = function () {
	return messages.length;
    };
};