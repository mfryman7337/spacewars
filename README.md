## Space Wars: A Game of Interplanetary Exploration and Conquest

Space Wars is a 3D turn-based strategy game. Ready to conquer some planets? Of course you are: [Go play the game!](http://kohlmannj.github.io/spacewars)

### Source Layout

All files types are laid into their own respective folders.

### Shaders

All shaders are in the shaders folder, and their file names aptly describe what they're used to draw.


### JS Files

To start looking at the source, start in App.js.

**App.js**: Creates basic UI elements, and initializes the game engine once the player has selected their options.

**Engine.js**: Handles most of the high level delegation of game operations. Contains the main game loop, player
           creation, performing of verbs, as well as the initialization of OpenGL.

**boundary.js**: Used to encapsulate the drawing of the player boundaries around their network.

**camera.js**: Lightweight camera class used to generate the view and projection matrices.

**EdgeScroller.js**: Handles how scrolling at the edge of the viewport works.

**map_gen.js**: Contains all the code for generating the various map types.

**MenuController.js**: Contains the code to manage the menu that appears when a player clicks on a planet.

**MessageQueue.js**: Code for the message queue that appears in the bottom right of the player screen.

**NameGenerator.js**: Generates planet names

**PlanetEdge.js**: The edges of the gameplay graph (Including draw code).

**PlanetVertex.js**: Code for the actual nodes of the graph, or planets (Including draw code).

**PlanetGraph.js**: Code for the overall graph object, including adding vertices and making edges.

**player.js**: Contains a class for individual players, as well as AI code.

**Queue.js**: A simple queue class.

**RequestAnimationFrame.js**: Encapsulates the mechanism for controlling the draw loop.

**stars.js**: The code for the starry backdrop.

**sugar.js**: Assorted helper methods.

**Three.js**: The THREE JavaScript library

**TooltipController.js**: Controls tooltips that appear on mouseover of planets

**TurnController.js**: Controls the turn based aspect of players as well as routing player verbs to the engine.

**UIController.js**: Overarching controller of UI (Menu, tooltips, etc.) objects.

**vect.js**: Our vector class.

### Compass and Sass

This project uses Compass <http://compass-style.org/> and Sass <http://sass-lang.com/> for awesome stylesheet
capabilities. The CSS files have already been generated, but you'll need Sass and Compass on your system
to re-generate them.

### Planet Textures

This project uses the planet textures generously made available for free by James Hastings-Trew. They are publicly
available for download at his website, <http://planetpixelemporium.com/>.

### Additional Artwork Notes

All other artwork included in this project, including icons and visual design is original work produced by
the project authors. The one exception is the celebratory winning graphic, which is derived from
multiple works and is considered a derivative, transformative fair-usage creation.
