// If you're looking at the code, that's awesome!
// (You can also find the repo at https://github.com/alexander-i-yang/ube)
// From Yam (the Dev)

import {
	Vector,
	VectorUp,
    VectorRight,
    VectorDown,
    VectorLeft,
    VectorZero,
	numToVec,
	framesToMs,
	shuffle
} from './math.js';
import * as Sprites from "./sprites.js";
import { Time, Timer } from './time.js';
import * as Graphics from './graphics.js';
import { Diagnostics, timeIt } from './diagnostics.js';
import { DrawablePool, CollidablePool, UpdateablePool } from './pools.js';
import { Entity } from './entity.js';
import {camera} from './camera.js';
import {PhysObj, RectHitbox, DummyCollisionHandler, DummyCollidableProvider, DummyUpdateHandler, getDefaultFallV} from './physics.js';
import {InputProvider, TASInputProvider} from './input.js';
import {GroundedProvider, FallUpdateHandler } from './physUpdateHandlers.js';
import * as Player from './player.js';

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
}

class UpdatableDrawableEntity extends DrawableEntity {
	constructor(parent, drawable, updateHandler) {
		super(parent, drawable);
		this._updateHandler = updateHandler;
	}

	draw(camera) {
		const pos = this.globalPosition().trunc();
		this.drawable.draw(
			pos.x,
			pos.y,
			camera
		);
	}

	update(time) {this._updateHandler.update(time, this);}
}

function makeWall(parent, relativePosition, sprite, registrar) {
	const hitbox = new RectHitbox(parent, relativePosition, 8, 8);

	const physObj = new PhysObj(
		hitbox,
		new DummyUpdateHandler(),
		new DummyCollisionHandler(),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(hitbox, sprite);
	registrar.registerCollidable(physObj);
	registrar.registerUpdateable(physObj);
	registrar.registerDrawable(drawableEntity);
}

function makePhysObj(hitbox, updateHandler, collidableProvider, sprite, registrar) {
	const physObj = new PhysObj(
		hitbox,
		updateHandler,
		new Player.CollisionHandler(),
		collidableProvider
	);

	const drawableEntity = new DrawableEntity(physObj, sprite);
	registrar.registerCollidable(physObj);
	registrar.registerUpdateable(physObj);
	registrar.registerDrawable(drawableEntity);
}

function makePlayer(parent, position, inputProvider, groundedProvider, collidableProvider, registrar) {
	const physObj = new PhysObj(
		new RectHitbox(parent, position, 8, 8),
		new Player.UpdateHandler(
			inputProvider,
			groundedProvider,
			[
				new Player.FallUpdateHandler(),
				new Player.JumpUpdateHandler(),
				new Player.DoubleJumpHandler(),
				new Player.HorizontalUpdateHandler()
			]
		),
		new Player.CollisionHandler(),
		collidableProvider
	);

	const drawableEntity = new UpdatableDrawableEntity(
		physObj,
		new Sprites.AnimatedSprite(
			Sprites.SPRITES.MAIN_CHARA_SPRITESHEET,
			[
				{frames: 1, onComplete: "stop"},
				{frames: 6, onComplete: "loop", nth: 10},
				{frames: 1, onComplete: "stay", nth: 1}],
			null
		),
		new Player.DrawableUpdateHandler(physObj)
	);

	registrar.registerCollidable(physObj);
	registrar.registerUpdateable(physObj);
	registrar.registerUpdateable(drawableEntity);
	registrar.registerDrawable(drawableEntity);
}

class Root {
	constructor() {
		this._drawablePool = new DrawablePool();
		this._collidablePool = new CollidablePool();
		this._updateablePool = new UpdateablePool();
		this._inputProvider = new InputProvider();
		// this._inputProvider = new TASInputProvider();
		const groundedProvider = new GroundedProvider(this._collidablePool);
		const fallUpdateHandler  = new FallUpdateHandler(groundedProvider);

		this._updateablePool.register(camera);

		const registrar = new Registrar(
			this._collidablePool,
			this._drawablePool,
			this._updateablePool
		); //TODO - move into constructor injection

		for (let i = 0; i < 10; ++i) {
			makeWall(
				this,
				Vector({x: i*8, y: 128}),
				new Sprites.TileSprite(Sprites.SPRITES.WALL_TILESHEET, i === 0 ? VectorZero : i === 9 ? VectorRight.scalar(2) : VectorRight),
				registrar
			);
			makeWall(
				this,
				Vector({x: i*8, y: 100}),
				new Sprites.TileSprite(Sprites.SPRITES.WALL_TILESHEET, i === 0 ? VectorZero : i === 9 ? VectorRight.scalar(2) : VectorRight),
				registrar
			);
		}

		makePhysObj(
			new RectHitbox(this, VectorRight.scalar(40), 8, 8),
			fallUpdateHandler,
			this._collidablePool,
			new Sprites.AnimatedSprite(Sprites.SPRITES.BUTTON, [{"frames": 0, onComplete: "stop"}, {"frames": 6, onComplete: "stop", nth: 10}]),
			registrar
		)

		makePhysObj(
			new RectHitbox(this, VectorRight.scalar(64), 8, 8),
			fallUpdateHandler,
			this._collidablePool,
			new Sprites.AnimatedSprite(Sprites.SPRITES.BUTTON, [{"frames": 0, onComplete: "stop"}, {"frames": 6, onComplete: "stop", nth: 10}]),
			registrar
		)

		makePlayer(
			this,
			Vector({x: 12, y: 20}),
			this._inputProvider,
			groundedProvider,
			this._collidablePool,
			registrar
		);

		this.trueTime = new Time();
	}

	globalPosition() {
		return VectorZero;
	}

	draw() {
		this._drawablePool.drawAll(camera);
	}

	update() {
		this.trueTime.tick();
		this._inputProvider.update();
		this._updateablePool.updateAll(this.trueTime);
	}
}

class Registrar {
	constructor(collidablePool, drawablePool, updateablePool) {
		this._drawablePool = drawablePool;
		this._collidablePool = collidablePool;
		this._updateablePool = updateablePool;
	}

	registerDrawable(d) {
		this._drawablePool.register(d);
	}

	registerCollidable(c) {
		this._collidablePool.register(c);
	}

	registerUpdateable(u) {
		this._updateablePool.register(u);
	}
}

class RegistrarDebug {
	constructor(collidablePool, drawablePool, updateablePool) {
		this._drawablePool = drawablePool;
		this._collidablePool = collidablePool;
		this._updateablePool = updateablePool;
	}

	registerDrawable(d) {
		this._drawablePool.register(d);
	}

	registerCollidable(c) {
		this._collidablePool.register(c);
		this.registerDrawable(c);
	}

	registerUpdateable(u) {
		this._updateablePool.register(u);
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
	- new "Wall" is just a physObj
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