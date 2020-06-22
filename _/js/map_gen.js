//map_gen.js -- Joe Kohlmann, Russel Mommaerts, James Merrill, Zack Krejci
(function() {

    var SPACING = 500.0;
    var JITTER = 100.0
    var RADIUS = 15.0;
    
    var resourceLevel = {
        bling: "bling",
        high: "high",
        medium: "medium",
        low: "low",
        any: "any"
    };
    
    var textures = null;
    
    var tryLoadTextures = function() {
        
        if (textures == null) {
            
            textures = [
                getTexture ('_/tex/earthmap.jpg'),
                getTexture ('_/tex/jupitermap.jpg'),
                getTexture ('_/tex/marsmap.jpg'),
                getTexture ('_/tex/mercurymap.jpg'),
                getTexture ('_/tex/neptunemap.jpg'),
                getTexture ('_/tex/plutomap.jpg'),
                getTexture ('_/tex/saturnmap.jpg'),
                getTexture ('_/tex/venus1.png')
            ];
        }
    };
    
    //Gets a random float between min and max
    var getRandomNumber = function(min, max) {
        
        var range = max - min;      
        return (Math.random() * range) - (range / 2);
    };
    
    //Gets the index of the minimum value in an array
    var getMinIndex = function(array) {
        
        var minIndex = 0;
        
        for (var i = 1; i < array.length; i++) {
            
            if (array[i] < array[minIndex]) {
                minIndex = i;
            }
        }
        
        return minIndex;
    };
    
    //Gets an array containing the closest planets to a passed planet
    //  planet: The planet that will have its nearest neighbors found
    //  planetList: An array containing the neighbor planets
    //  count: How many closest planets to find
    var getClosestPlanets = function(planet, planetList, count) {
        
        var toReturn = [];
        
        var distances = new Array(planetList.length);
        var planetIndex = planetList.indexOf(planet);
        
        if (planetIndex >= 0) {
            distances[planetIndex] = Number.MAX_VALUE;
        }
        
        for (var i = 0; i < planetList.length; i++) {
            
            if (i == planetIndex) {
                continue;
            }
            
            var deltaX = planetList[i].position.x - planet.position.x;
            var deltaY = planetList[i].position.y - planet.position.y;
            
            distances[i] = deltaX * deltaX + deltaY * deltaY;
        }
        
        //Now find the closest ones
        for (var i = 0; i < count; i++) {
            
            var minIndex = getMinIndex(distances);
            distances[minIndex] = Number.MAX_VALUE;
            
            toReturn.push(planetList[minIndex]);
        }
        
        return toReturn;
    };
    
    var getAveragePosition = function(planets) {
        
        var x = 0;
        var y = 0;
        
        for (var i = 0; i < planets.length; i++) {
            
            x += planets[i].position.x;
            y += planets[i].position.y;
        }
        
        return { x: x / planets.length, y: y / planets.length };
    }
    
    var connectClusters = function(graph, cluster1, cluster2, edgeCount) {
        
        var position1 = getAveragePosition(cluster1);
        
        var fakePlanet1 = {
            
            position: {
                x: position1.x,
                y: position1.y
            }
        };
        
        var closest1 = getClosestPlanets(fakePlanet1, cluster2, edgeCount);
        
        var position2 = getAveragePosition(cluster2);
        var fakePlanet2 = {
            
            position: {
                x: position2.x,
                y: position2.y
            }
        };
        
        var closest2 = getClosestPlanets(fakePlanet2, cluster1, edgeCount);
        
        for (var i = 0; i < edgeCount; i++) {
            
            graph.make_edge(closest1[i], closest2[i]);
        }
    };
    
    var getRandomTexture = function() {       
        return textures[Math.floor(Math.random() * textures.length)];
    };
    
    var getPlanetSize = function(resource) {
        
        if (resource == resourceLevel.bling) {
            return Math.floor(Math.random() * 40) + 85;
        }
        
        if (resource == resourceLevel.high) {
            return Math.floor(Math.random() * 75) + 50;
        }
                
        if (resource == resourceLevel.medium) {
            return Math.floor(Math.random() * 50) + 45;
        }
                
        if (resource == resourceLevel.low) {
            return Math.floor(Math.random() * 30) + 40;
        }
                
        if (resource == resourceLevel.any) {
            return Math.floor(Math.random() * 85) + 40;
        }
        
        throw "Bad resource type";
    };
    
    //Creates a cluster of planets and returns the array containing the generated planets
    //  graph: The graph to add the planets to
    //  x: The x position to center the cluster on
    //  y: The y position to center the cluser on
    //  radius: The radius of the cluster
    //  planetCount: How many planets to generate
    //  minDistance: The closest together two planets can be
    //  resourceLevel: How high resource the planets generated are
    //  connectivity: How many edges each planet in the cluster must have
    var createCluster = function(graph, x, y, radius, planetCount, minDistance, resourceLevel, connectivity) {
        
        var radiusSquared = radius * radius;
        var minSquareDistance = minDistance * minDistance;  //So we don't need sqrt
        var planets = [];
        
        var xValues = [];
        var yValues = [];
        
        var tries = 5000;
        
        if (!resourceLevel) {          
            resourceLevel = resourceLevel.any;
        }
        
        if (!connectivity) {
            connectivity = 2;
        }
        
        while (planets.length < planetCount && tries >= 0) {
            
            tries--;
            
            var deltaX = getRandomNumber(-radius, radius);
            var deltaY = getRandomNumber(-radius, radius);
            
            var distance = deltaX * deltaX + deltaY * deltaY;
            
            if (distance <= radiusSquared) {
                
                //Check if the planet is too close to other generated planets
                var tooClose = false;
                
                for (var i = 0; i < planets.length; i++) {
                    
                    var xDiff = deltaX - xValues[i];
                    var yDiff = deltaY - yValues[i];
                    
                    var dist = xDiff * xDiff + yDiff * yDiff;
                    
                    if (dist < minSquareDistance) {
                        
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
                
                    var v = graph.vertex({
                        position: new vect(x + deltaX, y + deltaY),
                        r: getPlanetSize(resourceLevel),
                        tex: getRandomTexture()
                    });
                    
                    planets.push(v);
                    
                    xValues.push(deltaX);
                    yValues.push(deltaY);
                }
            }
        }
        
        //Connect every planet to its two closest planets
        connectPlanets(graph, planets, connectivity);
        
        return planets;
    };
    
    var squareDistance = function(x1, y1, x2, y2) {
        return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
    }
    
    //Generates a cluster of planets that will not overlap with a passed array of planets
    //  graph: The graph to add the planets to
    //  x: The x position to center the cluster on
    //  y: The y position to center the cluser on
    //  radius: The radius of the cluster
    //  planetCount: How many planets to generate
    //  toAvoid: The array of planets to not overlap with
    var createClusterAvoidPlanets = function(graph, x, y, radius, planetCount, toAvoid, resourceLevel) {
        
        var radiusSquared = radius * radius;
        var minSquareDistance = 300 * 300;
        var newPlanets = [];
        
        var tries = 5000;
        
        while (newPlanets.length < planetCount && tries >= 0) {
            
            tries--;
            var xPos = x + getRandomNumber(-radius, radius);
            var yPos = y + getRandomNumber(-radius, radius);
            var tooClose = false;
            
            for (var i = 0; i < toAvoid.length; i++) {
                
                if (squareDistance(xPos, yPos, toAvoid[i].position.x, toAvoid[i].position.y) < minSquareDistance) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                
                var v = graph.vertex({
                    position: new vect(xPos, yPos),
                    r: getPlanetSize(resourceLevel),
                    tex: getRandomTexture()
                });
                
                toAvoid.push(v);
                newPlanets.push(v);
            }
        }
        
        return newPlanets;
    };

    //Randomly connects an array on planets
    //  graph: The graph containing the planets
    //  planets: The array of planets to connect
    //  edgeCount: How many edges to make out of each planet
    var connectPlanets = function(graph, planets, edgeCount) {
        
        for (var i = 0; i < planets.length; i++) {
            
            var closest = getClosestPlanets(planets[i], planets, edgeCount);
            
            for (var j = 0; j < closest.length; j++) {
                graph.make_edge(planets[i], closest[j]);
            }
        }
    };
    
    MapGenerator = {
    
        generate: function(graph, size) {
            
            switch (size) {
                
                case 1:
                    this.generateTiny(graph);
                    break;
                    
                case 2: 
                    this.generateIslands(graph);
                    break;
                    
                case 3:
                    this.generateRectangle(graph, 10, 5);
                    break;
                    
                case 4:
                    this.generateSpiral(graph, 5);
                    break;
                    
                default:
                    throw "Somebody screwed up!";
                    break;
            }
        },
    
        //Generates a tiny basic map
        generateTiny: function(graph) {
            
            tryLoadTextures();
            
            //var createCluster = function(graph, x, y, radius, planetCount, minDistance) {
            var planets = createCluster(graph, 0, 0, 900, 14, 400, resourceLevel.medium);
            
            graph.addHomePlanet(planets[0]);
            graph.addHomePlanet(planets[1]);
            
            connectPlanets(graph, planets, 3);
        },
        
        //Generates an island style map
        generateIslands: function(graph) {
            
            tryLoadTextures();
            
            var center = createCluster(graph, 0, 0, 700, 7, 400, resourceLevel.bling);
            connectPlanets(graph, center, 2);
            
            var offset = 1350;
            var radius = 900;
            var minDistance = 325;
            var edgeCount = 3;
            
            var topRight = createCluster(graph,  offset,  offset, radius, Math.floor(Math.random() * 3) + 16, minDistance, resourceLevel.medium, edgeCount);
            var topLeft  = createCluster(graph, -offset,  offset, radius, Math.floor(Math.random() * 3) + 16, minDistance, resourceLevel.medium, edgeCount);
            var botRight = createCluster(graph,  offset, -offset, radius, Math.floor(Math.random() * 3) + 16, minDistance, resourceLevel.medium, edgeCount);
            var botLeft  = createCluster(graph, -offset, -offset, radius, Math.floor(Math.random() * 3) + 16, minDistance, resourceLevel.medium, edgeCount);
            
            graph.addHomePlanet(topRight[Math.floor(Math.random() * topRight.length)]);
            graph.addHomePlanet(topLeft[Math.floor(Math.random() * topLeft.length)]);
            graph.addHomePlanet(botRight[Math.floor(Math.random() * botRight.length)]);
            graph.addHomePlanet(botLeft[Math.floor(Math.random() * botLeft.length)]);
            
            connectClusters(graph, topRight, topLeft, 3);
            connectClusters(graph, topRight, botRight, 3);
            connectClusters(graph, botRight, botLeft, 3);
            connectClusters(graph, botLeft, topLeft, 3);
            
            connectClusters(graph, topRight, center, 2);
            connectClusters(graph, topLeft, center, 2);
            connectClusters(graph, botLeft, center, 2);
            connectClusters(graph, botRight, center, 2);
        },
    
        //Generates a rectangular map
        generateRectangle: function(graph, width, height) {

            //Load the textures on demand
            tryLoadTextures();
            
            var count = 1;
            var planets = [];
            
            for (var i = 0; i < width; i ++) {
            
                var this_row = [];
                planets.push (this_row);
                
                for (var j = 0; j < height; j ++) {
                
                    var texture, size;
                    
                    if (count != 41) {

                        texture = getRandomTexture();
                        size = Math.random () * 2 * RADIUS - RADIUS;
                    }
                    else {
                    
                        texture = getTexture ('_/tex/earthmap.jpg');
                        size = 0;
                    }
                    
                    //var x = (i  * SPACING) - width / 2.0 + (Math.random () * JITTER - JITTER / 2.0);
                    //var y = (j  * SPACING) - height / 2.0 + (Math.random () * JITTER - JITTER / 2.0);
                    var x = i * SPACING - (width - 1) * (SPACING) / 2 + Math.random () * JITTER - JITTER / 2.0;
                    var y = j * SPACING - (height - 1) * (SPACING) / 2 + Math.random () * JITTER - JITTER / 2.0;
                    var v = graph.vertex ({
                        position: new vect (x, y),
                        r: getPlanetSize(resourceLevel.medium),
                        tex: texture
                    });
                    count ++;
                    this_row.push (v);
                }
            }
            
            console.log (count);
            for (var i = 0; i < width; i ++) {
            
                for (var j = 0; j < height; j ++) {
                
                    var num_edges = Math.floor (Math.random () * 1.5) + 2;
                    //var num_edges = 3;
                    var bucket = [[-1, 0], [0, -1], [0, 1], [1, 0]];
                    for (var k = 0; k < num_edges; k ++) {
                    var v1 = planets[i][j];
                    var v2;
                    
                    var made_edge = false;
                    
                    while (!made_edge) {
                    
                        if (bucket.length <= 0)
                            break;
                            
                        var index = Math.floor (Math.random () * bucket.length);
                        var target = bucket.splice (index, 1)[0];
                        
                        if (i + target[0] < planets.length && i + target[0] >= 0) {
                        
                            if (j + target[1] < planets[i + target[0]].length && j + target[1] >= 0) {
                            
                                made_edge = true;
                                v2 = planets[i + target[0]][j + target[1]];
                                graph.make_edge (v1, v2);
                            }
                        }
                    }
                    // Does that target planet have an edge?
                    // Okay, go make an edge
                    }
                }
            }
            
            //Set up the home planets
            graph.addHomePlanet(planets[0][0]);
            graph.addHomePlanet(planets[0][planets[0].length - 1]);
            graph.addHomePlanet(planets[planets.length - 1][0]);
            graph.addHomePlanet(planets[planets.length - 1][planets[planets.length - 1].length - 1]);
            
            for (var i = 0; i < width; i ++) {
                for (var j = 0; j < height; j ++) {
                
                    if (planets[i][j].neighbors () == 0)
                    console.log ('0 neighbors: Unreachable vertex in graph!');
                }
            }
        },
        
        //Generates a spiral galaxy
        generateSpiral: function(graph, arms) {
            
            var createdPlanets = [];
            
            //Load the textures on demand
            tryLoadTextures();
            
            var deltaAngle = (2*Math.PI / 30);      //The different in angle between planets
            var anglePerArm = (2*Math.PI) / arms;   //The difference in start angle between arms
            
            var armLength = 1800;
            var deltaArm = 300;
            var armStart = deltaArm * 3;
            var planetDistance = 300;
            
            var planetCount = Math.floor(armLength / deltaArm);
            
            //Gets the angle for an arm and planet
            var getAngle = function(arm, planet) {
                return (anglePerArm * arm) + (deltaAngle * planet);
            };
            
            //Helper method to get the point at which a planet should be placed
            //  arm: The index (but can be a float) of the arm the planet it is
            //  planet: The index (can also be a float) of the planet in the arm
            var getArmPoint = function(arm, planet) {
                
                var angle = getAngle(arm, planet);
                var radius = armStart + (deltaArm * planet);
                
                return new vect(radius * Math.cos(angle), radius * Math.sin(angle));
            };
            
            //Gets how many planets should be placed at a passed planetIndex
            var getPlanetCount = function(planet) {
                
                var radius = deltaArm * planet;
                
                //Get how far along the arm this planet is, in terms of a percent
                var percent = 1 - (radius / armLength);
                
                if (percent >= 0.6) {
                    return 3;
                }
                    
                if (percent >= 0.2) {
                    return 2;
                }
                    
                return 1;
            };
            
            var center = createCluster(graph, 0, 0, deltaArm * 2, 10, 300, resourceLevel.high);
            
            for (var i = 0; i < center.length; i++) {
                createdPlanets.push(center[i]);
            }
            
            //Shoulder planets are the planets closest to the center
            var shoulders = [];
            
            for (var armIndex = 0; armIndex < arms; armIndex++) {
                
                var planets = [];
                
                for (var planetIndex = 0; planetIndex < planetCount; planetIndex++) {
                    
                    //Get the real point and then a point close to it
                    var point = getArmPoint(armIndex, planetIndex);
                    var normal = getArmPoint(armIndex, planetIndex + 0.001);
                
                    //normal - point == the vector from point to normal
                    //normal is now the derivative at point
                    normal.sub(point);
                        
                    //Now rotate 90 degrees around Z and we have the normal at point
                    normal.rotateZ(Math.PI / 2);
                    normal.normalize();
                    
                    var planetsAtPoint = getPlanetCount(planetIndex);
                    var planetPoint;
                    
                    //If there's only one planet we want to aligned directly on the arm
                    if (planetsAtPoint == 1) {
                        planetPoint = point;
                    }
                    else {
                        planetPoint = vect.add(point, vect.scale(normal, -planetDistance * planetsAtPoint / 2));
                    }
                    
                    var delta = vect.scale(normal, planetDistance);
                    
                    for (var i = 0; i < planetsAtPoint; i++) {
                        
                        var toAdd = graph.vertex ({
                            position: planetPoint.clone(),
                            r: getPlanetSize(resourceLevel.medium),
                            tex: getRandomTexture()
                        });
                        
                        toAdd.edgesToGen = 3;
                        
                        if (planetIndex == 0) {
                            shoulders.push(toAdd);
                        }
                        else if (planetIndex == planetCount - 1) {
                            graph.addHomePlanet(toAdd);
                            toAdd.edgesToGen = 2;
                        }
                        
                        createdPlanets.push(toAdd);
                        planets.push(toAdd);
                        planetPoint.add(delta); 
                    }
                     
                }
                
                for (var i = 0; i < planets.length; i++) {
                    
                    var closest = getClosestPlanets(planets[i], planets, planets[i].edgesToGen);
                    
                    for (var closeIndex = 0; closeIndex < closest.length; closeIndex++) {
                        graph.make_edge(planets[i], closest[closeIndex]);
                    }
                }
            }
            
            var sprinkles = createClusterAvoidPlanets(graph, 0, 0, deltaArm * 3, 10, createdPlanets, resourceLevel.medium);
            
            for (var i = 0; i < sprinkles.length; i++) {
                
                var closest = getClosestPlanets(sprinkles[i], createdPlanets, 3);
                center.push(sprinkles[i]);
                
                graph.make_edge(sprinkles[i], closest[0]);
                graph.make_edge(sprinkles[i], closest[1]);
                graph.make_edge(sprinkles[i], closest[2]);
            }
            
            //Connect the shoulders to the center cluster
            for (var sIndex = 0; sIndex < shoulders.length; sIndex++) {
                
                var closest = getClosestPlanets(shoulders[sIndex], center, 1);
                graph.make_edge(shoulders[sIndex], closest[0]);
            }
        }
        
    };
})();