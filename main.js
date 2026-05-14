// If you're looking at the code, that's awesome! Leave a comment on Itch if you need help!
// (You can also find the repo at https://github.com/alexander-i-yang/minigame)
// From Yam (the Dev)

import {
	Vector,
	VectorUp,
    VectorRight,
    VectorDown,
    VectorLeft,
    VectorZero,
	Rectangle,
	numToVec,
	framesToMs,
	shuffle
} from './math.js';
import * as Sprites from "./sprites.js";
import { Time } from './time.js';
import * as Graphics from './graphics.js';
import { Diagnostics, timeIt } from './diagnostics.js';
import { DrawablePool } from './pools.js';
import { Entity } from './entity.js';
import {camera} from './camera.js';

let root;

class DrawableEntity extends Entity {
	constructor(parent, drawable) {
		super(parent);
		this.drawable = drawable;
	}

	draw(camera) {
		const pos = this.globalPosition().trunc();
		this.drawable.draw(
			pos.x,
			pos.y,
			camera
		);
	}

	update(time) {
		this.relativePosition.incrPoint(VectorRight.scalar(1.7 / time.delta));
	}
}

class Root {
	constructor() {
		this.drawablePool = new DrawablePool();

		const s = new Sprites.Sprite(Sprites.SPRITES.MAIN_CHARA_SPRITESHEET);
		const dE = new DrawableEntity(this, s);
		this.drawablePool.register(dE);
		this.children = [
			camera,
			dE
		];

		this.trueTime = new Time();
	}

	globalPosition() {
		return VectorZero;
	}

	draw() {
		this.drawablePool.drawAll(camera);
	}

	update() {
		this.trueTime.tick();
		this.children.forEach(c => c.update(this.trueTime));
	}
}

let diagnostics;
function mainLoop() {
	Graphics.setMaxSize();
	Graphics.clearCanvas();
	root.update();
	root.draw();
	// TrueTime.tick();
	// camera.update();
	// if (!TrueTime.paused) game.update();
	// game.setKeys(keys);
	// game.drawAll();
}

;(function () {
	timeIt("Total setup", setup);
})();

async function setup() {
	Graphics.setupCanvas();
	// perlinTest();
	document.addEventListener('keydown', keyDownHandler, false);
	document.addEventListener('keyup', keyUpHandler, false);
	diagnostics = new Diagnostics();
	
	root = new Root();
	
	// let levelData = await timeIt("Read level data", getLevelData);
	
	// timeIt("Build levels", () => game.buildLevels(levelData));
	main();
}

function main() {
	var stopMain = window.requestAnimationFrame(main);
	diagnostics.diagnostics(mainLoop);
}

let keys = {
	"ArrowRight": 0,
	"ArrowLeft": 0,
	"ArrowDown": 0,
	"ArrowUp": 0,
	"KeyZ": 0,
	"KeyX": 0,
	"PrevJump": 0,
	"PrevSlide": 0,

	// //Debug keys
	"KeyO": 0, //fly
	"KeyH": 0, //jump
	"KeyJ": 0,
	"KeyK": 0,
	"KeyL": 0,
	"KeyI": 0,


	// "KeyP" : 0,
	"KeyC": 0,
	"KeyR": 0,
	"Enter": 0,

	"KeyW": 0,
	"KeyA": 0,
	"KeyS": 0,
	"KeyD": 0,
	"KeyN": 0,
	"KeyM": 0,
};

function keyDownHandler(event) {
	if (event.code in keys) {
		keys[event.code] = 1;
	}
}

function keyUpHandler(event) {
	if (event.code in keys) {
		keys[event.code] = 0;
	}
}

/*
# Enity
Entity has:
- position
- parent
- ~~components~~ Nah, we can do the Godot method. All components are children.
- children?
- ~~update function (pass input into update function)~~
- ~~draw function~~

IUpdateable
- Update() method

IDrawable
- Draw() method
- GetLayer() method/layer property

Only one parent (Game) can be root

# Game
Game has:
- position

Ex: PhysObj
- Is a component?
- Contains behaviors...
- Hm maybe this should be an entity.
- Can this extend Entity?

Ex: Wall
- Set components
	- Phys behavior - wall
	- Sprite
Physobj is an entity
- Everything extends entity

Sprite Component
- Sprite needs a camera + sprite
- Custom draw functions necessary

Drawing
- Priority queue
	- Every draw call, iterate through the entire object tree and insert each entity into the queue
- Array of arrays
	- Keep an array A of object arrays Bn
	- On object creation to layer i, add object to A[i] = Bi
	- Every draw call, iterate through A[0-a][0-b]
	- All Bn can be drawn in parallel? We'd have to sort by position
	- This means that object creation needs to ask the sprite what layer it's on.
	- We could try making the draw layer a property of the entity.
		- But that wouldn't make any sense. Only drawable things should have a draw layer.
	- You only make an array of sprites.
	- We could update the array every frame?
	- all new Sprites require the pool as a dependency
- Elements with the same

# Pooling
- What if pooling is handled on the parental level?
- Sprite pooling can be the exception. Sprite pooling can be static for now

# Example composition root
- Game
	- new SpritePooler
	- new ActorPooler
	- new Solid pooler
	- new ChildFactory(SpritePooler)
- Game set children
	- new "Wall" is just a physobj
		- new WallBehavior
		- Set wall children
			- ChildFactory.NewSprite(new Sprite)
		- Game adds Wall to solid pool
	- new "Player" extends PhysObj
		- new WallCollidableBehavior
		- new Sprite
			- SpritePool.addSprite
		- Game adds player to actor pool
- Update game
	- Game.UpdateablePool.UpdateAll(Ti)
		- Update Player
			- check collision - get position by calling parent.getPosition()
		- Update Wall
	- We should probably use some deterministic ordering for all these.
- Draw game
	- DrawablePool.Foreach.Draw();
- Collision checking
	- With two global objects: call globalPosition and globalPosition
		- Both go down their parents to the root
		- Both 
*/