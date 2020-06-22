// "Sugar" from JavaScript: The Good Parts
Function.prototype.method = function(name, func) {
    this.prototype[name] = func;
    return this;
};

Function.method("inherits", function (Parent) {
    this.prototype = new Parent();
    return this;
});

// From http://www.mediacollege.com/internet/javascript/text/case-capitalize.html
String.prototype.capitalize = function() {
    return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
};

Array.prototype.remove = function(toRemove) {
    
    var index = this.indexOf(toRemove);
    
    if (index != -1) {
        this.splice(index, 1);
    }
};

// From http://strd6.com/2010/08/useful-javascript-game-extensions-clamp/
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};
