// If you're looking at the code, that's awesome!
// (You can also find the repo at https://github.com/yamEater20/ube)
// From Yam (the Dev)

import {
	Vector,
    VectorRight,
    VectorZero
} from './engine/math.js';
import { Time } from './time.js';
import { Diagnostics, timeIt } from './diagnostics.js';
import { Pool, CollidableProvider, Registrar } from './pools.js';
import {camera} from './camera.js';
import {InputProvider, TASInputProvider} from './input.js';
import * as UpdateHandlers from './physUpdateHandlers.js';
import * as Player from './player.js';
import { Room } from './world.js';
import * as Setup from './engine/setup.js';
import {toggleDebugAll, debugOptions} from "./engine/debug.js";

class RoomsCollidableProvider {
	constructor() {
		this._rooms = [];
		this._collidablePool = new CollidableProvider();
		this.roomIndex = 0;
	}

	registerRooms(rooms) {this._rooms = rooms;}
	register(c) {this._collidablePool.register(c);}

	getAllRiding(physObj) {
		const myAllRiding = this._collidablePool.getAllRiding(physObj);
		const roomAllRiding = this._rooms[this.roomIndex].getAllRiding(physObj);
		return myAllRiding.concat(roomAllRiding);
	}

	getAllCollidingExcept(physObj, offset, except) {
        const myAllColliding = this._collidablePool.getAllCollidingExcept(physObj, offset, except);
		const roomAllColliding = this._rooms[this.roomIndex].getAllCollidingExcept(physObj, offset, except);
		return myAllColliding.concat(roomAllColliding);
    }
}

class Root {
	constructor(trueTime, inputProvider) {
		this._drawablePool = new Pool();
		this._debugDrawablePool = new Pool();
		this._collidableProvider = new RoomsCollidableProvider();
		this._updateablePool = new Pool();
		this._resettablePool = new Pool();
		this._inputProvider = inputProvider;
		const groundedProvider = new UpdateHandlers.GroundedProvider(this._collidableProvider);

		this._updateablePool.register(camera);

		const registrar = new Registrar(
			this._collidableProvider,
			this._drawablePool,
			this._updateablePool,
			this._resettablePool,
			this._debugDrawablePool
		); //TODO - move into constructor injection

		const room = new Room(this, VectorZero, this._collidableProvider);
		const room2 = new Room(this, VectorRight.scalar(128), this._collidableProvider);
		registrar.registerDrawable(room);
		registrar.registerDrawable(room2);
		registrar.registerUpdateable(room);
		registrar.registerUpdateable(room2);
		this._collidableProvider.registerRooms([room, room2]);

		Player.make(
			this,
			Vector({x: 12, y: 20}),
			this._inputProvider,
			groundedProvider,
			this._collidableProvider,
			registrar
		);

		this.trueTime = trueTime;
	}

	globalPosition() {
		return VectorZero;
	}

	draw() {
		this._drawablePool.foreach(item => item.draw(camera));
		if (debugOptions.showHitboxes) this._debugDrawablePool.foreach(item => item.draw(camera));
	}

	update() {
		this.trueTime.tick();
		this._inputProvider.update();
		if (this._inputProvider.getInput().pausePressed)
			this.trueTime.togglePause();

		if (this._inputProvider.getInput().resetPressed)
			this._resettablePool.resetAll();

		if (this._inputProvider.getInput().debugPressed)
			toggleDebugAll();

		if (this._inputProvider.getInput().debugHitboxesPressed)
			debugOptions.showHitboxes = !debugOptions.showHitboxes;
		
		if (!this.trueTime.getPaused())
			this._updateablePool.foreach(item => item.update(this.trueTime));
	}
}

let root;

function mainLoop() {
	root.update();
	root.draw();
}

let mainLoopDiagnostics = new Diagnostics(mainLoop);

async function setup() {
	Setup.setup();
	root = new Root(
		new Time(),
		new InputProvider()
	);
	
	// let levelData = await timeIt("Read level data", getLevelData);
	
	// timeIt("Build levels", () => game.buildLevels(levelData));

	Setup.beginGameLoop(mainLoopDiagnostics.call);
}

;(function () {
	timeIt("Total setup", setup);
})();


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