//NameGenerator.js -- Russel Mommaerts, Joe Kohlmann, Zack Krejci, James Merrill
//Generates random names
(function() {
    
    var planetStarts = [
        "new ",
        "great ",
        "sur",
        "terra ",
        "jup",
        "cale",
        "vir",
        "hale",
        "fe",
        "mi",
        "pho",
        "de",
        "ma",
        "sat",
        "mer",
        "ve",
        "ur",
        "plu",
        "ill",
        "mir",
        "thes",
        "ando",
        "ear",
        "geno",
        "tu",
        "arc",
        "nov",
        "hades ",
        "pala",
        "pa",
        "ran"
    ];
    
    var planetMids = [
        "eden",
        "mi",
        "dos",
        "tres",
        "ros",
        "pi",
        "gi",
        "mo",
        "rs",
        "urn",
        "cu",
        "nus",
        "to",
		"anuth",
        "ium",
        "anda",
        "sia",
        "th",
        "kesh",
        "cha",
        "tur",
        "er",
        "ven",
        "la",
        "noch"
    ];
    
    var planetEnds = [
        " nova",
        " prime",
        " beta",
        " omega",
        "stron",
        "to",
        "tune",
        "anus",
        "ter",
        "re",
        "trom",
        "tron",
        "ry",
        "nus",
        "th",
        "nka",
        "ia",
        "ven"
    ];
    
    var planetNames = [ "earth" ];
    
    NameGenerator = {
        
        //Generates a random planet name, without duplicates
        generatePlanetName: function() {
    
            // Create a random planet name, please.
            var startIndex = Math.floor( Math.random() * planetStarts.length );
            var midsIndex = Math.floor( Math.random() * planetMids.length );
            var endsIndex = Math.floor( Math.random() * planetEnds.length );
            var useEnd = Math.random() > 0.25;
            
            var name = "" + planetStarts[startIndex] + 
                       planetMids[midsIndex] + 
                       (useEnd ? planetEnds[endsIndex] : "");
            
            if (planetNames.indexOf(name) != -1) {
                var newEndsIndex = Math.floor( Math.random() * planetEnds.length );
                var name = name + planetEnds[newEndsIndex];
            }
            
            return name.capitalize();
        }
    }
})();
