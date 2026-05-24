// If you're looking at the code, that's awesome!
// (You can also find the repo at https://github.com/yamEater20/ube)
// From Yam (the Dev)

import {
	Vector,
    VectorRight,
    VectorZero
} from './math.js';
import * as Sprites from "./sprites.js";
import { Time, Timer } from './time.js';
import * as Graphics from './graphics.js';
import { Diagnostics, timeIt } from './diagnostics.js';
import { DrawablePool, CollidablePool, UpdateablePool, Registrar, RegistrarDebug, ResettablePool } from './pools.js';
import {camera} from './camera.js';
import {PhysObj, RectHitbox, DummyCollisionHandler, DummyCollidableProvider, DummyUpdateHandler, getDefaultFallV} from './physics.js';
import {InputProvider, TASInputProvider} from './input.js';
import * as UpdateHandlers from './physUpdateHandlers.js';
import * as Player from './player.js';
import * as CollisionHandlers from './collisionHandlers.js';
import { DrawableEntity } from './drawableEntity.js';
import { ResetAtSpawn } from './reset.js';

function makeWall(parent, relativePosition, sprite, registrar) {
	const hitbox = new RectHitbox(parent, relativePosition, 8, 8);

	const physObj = new PhysObj(
		hitbox,
		new DummyUpdateHandler(),
		new CollisionHandlers.AdjectiveOnly(
			[new CollisionHandlers.Wall(), new CollisionHandlers.Ground()]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(hitbox, sprite);
	registrar.registerCollidable(physObj);
	registrar.registerDrawable(drawableEntity);
}

function makePhysObj(hitbox, updateHandler, collidableProvider, sprite, registrar) {
	const position = Vector({x: hitbox.relativePosition.x, y: hitbox.relativePosition.y});
	const physObj = new PhysObj(
		hitbox,
		updateHandler,
		new CollisionHandlers.Composite(
			[
				new CollisionHandlers.Ground(),
				new CollisionHandlers.PushableBox(),
				new CollisionHandlers.Ridable()
			],
			[
				//TODO: figure out lifetimes. These are stateless and should be singletons.
				new CollisionHandlers.PushableBoxReaction(),
				new CollisionHandlers.WallReaction(),
				new CollisionHandlers.GroundReaction()
			]
		),
		collidableProvider
	);

	const drawableEntity = new DrawableEntity(physObj, sprite);
	registrar.registerCollidable(physObj);
	registrar.registerUpdateable(physObj);
	registrar.registerDrawable(drawableEntity);
	registrar.registerResettable(physObj);
	registrar.registerResettable(new ResetAtSpawn(hitbox, position));
}

class Root {
	constructor(trueTime, inputProvider) {
		this._drawablePool = new DrawablePool();
		this._collidablePool = new CollidablePool();
		this._updateablePool = new UpdateablePool();
		this._resettablePool = new ResettablePool();
		this._inputProvider = inputProvider;
		const groundedProvider = new UpdateHandlers.GroundedProvider(this._collidablePool);
		const fallUpdateHandler  = new UpdateHandlers.FallUpdateHandler(groundedProvider);

		this._updateablePool.register(camera);

		const registrar = new RegistrarDebug(
			this._collidablePool,
			this._drawablePool,
			this._updateablePool,
			this._resettablePool
		); //TODO - move into constructor injection

		for (let i = 0; i < 20; ++i) {
			makeWall(
				this,
				Vector({x: i*8, y: 128}),
				new Sprites.TileSprite(Sprites.SPRITES.WALL_TILESHEET, i === 0 ? VectorZero : i === 19 ? VectorRight.scalar(2) : VectorRight),
				registrar
			);
			makeWall(
				this,
				Vector({x: i*8, y: 100}),
				new Sprites.TileSprite(Sprites.SPRITES.WALL_TILESHEET, i === 0 ? VectorZero : i === 19 ? VectorRight.scalar(2) : VectorRight),
				registrar
			);
		}

		makePhysObj(
			new RectHitbox(this, VectorRight.scalar(16), 8, 8),
			// new UpdateHandlers.Composite([fallUpdateHandler, new UpdateHandlers.MovingGuy()]),
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

		Player.make(
			this,
			Vector({x: 12, y: 20}),
			this._inputProvider,
			groundedProvider,
			this._collidablePool,
			registrar
		);

		this.trueTime = trueTime;
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
		if (this._inputProvider.getInput().pausePressed)
			this.trueTime.togglePause();

		if (this._inputProvider.getInput().resetPressed)
			this._resettablePool.resetAll();
		
		if (!this.trueTime.getPaused())
			this._updateablePool.updateAll(this.trueTime);
	}
}

let diagnostics;
let root;

function mainLoop() {
	Graphics.setMaxSize();
	Graphics.clearCanvas();
	root.update();
	root.draw();
}

;(function () {
	timeIt("Total setup", setup);
})();

async function setup() {
	Graphics.setupCanvas();
	
	diagnostics = new Diagnostics();
	
	root = new Root(
		new Time(),
		new InputProvider()
	);
	
	// let levelData = await timeIt("Read level data", getLevelData);
	
	// timeIt("Build levels", () => game.buildLevels(levelData));
	main();
}

function main() {
	var stopMain = window.requestAnimationFrame(main);
	diagnostics.diagnostics(mainLoop);
}

/*

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