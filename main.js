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
import { CollidableProvider, POOL_TYPES, Registrar, PoolTypesFactory, Pool } from './pools.js';
import {camera} from './camera.js';
import {InputProvider, TASInputProvider} from './input.js';
import * as UpdateHandlers from './physUpdateHandlers.js';
import * as Player from './player.js';
import { Room } from './world.js';
import * as Setup from './engine/setup.js';
import {toggleDebugAll, debugOptions} from "./engine/debug.js";

// class RoomsCollidableProvider {
// 	constructor() {
// 		this._rooms = [];
// 		this._collidablePool = new CollidableProvider();
// 		this.roomIndex = 0;
// 	}

// 	registerRooms(rooms) {this._rooms = rooms;}
// 	register(c) {this._collidablePool.register(c);}

// 	getAllRiding(physObj) {
// 		const myAllRiding = this._collidablePool.getAllRiding(physObj);
// 		const roomAllRiding = this._rooms[this.roomIndex].getAllRiding(physObj);
// 		return myAllRiding.concat(roomAllRiding);
// 	}

// 	getAllCollidingExcept(physObj, offset, except) {
//         const myAllColliding = this._collidablePool.getAllCollidingExcept(physObj, offset, except);
// 		const roomAllColliding = this._rooms[this.roomIndex].getAllCollidingExcept(physObj, offset, except);
// 		return myAllColliding.concat(roomAllColliding);
//     }
// }

class RegistrarWithRooms {
	constructor(registrar) {
		this._registrar = registrar,
		this._roomsPool = new RoomsPool();
	}

	getPool(poolType) {
		return this._registrar.getPool(poolType).concat(this._roomsPool.getCurrentPool(poolType));
	}

	registerItem(poolType, object) {
		this._registrar.registerItem(poolType, object);
	}
}

class RoomsPool extends Pool {
	constructor(items) {
		super(items);
		this.roomIndex = 0;
	}

	getCurrentRoom() {
		return this.get()[this.roomIndex];
	}

	getPool(poolType) {
		return this.getCurrentRoom().getPool(poolType);
	}
}

class Root {
	constructor(trueTime, inputProvider, registrar) {
		this._trueTime = trueTime;
		this._inputProvider = inputProvider;
		
		this._registrar = Regis;

		const globalCollidableProvider = this._registrar.getPool(POOL_TYPES.COLLIDABLE);
		const groundedProvider = new UpdateHandlers.GroundedProvider(globalCollidableProvider);

		const room = new Room(this, VectorZero, globalCollidableProvider);
		const room2 = new Room(this, VectorRight.scalar(128), globalCollidableProvider);
		
		

		this._registrar.registerItem(POOL_TYPES.UPDATEABLE, camera);

		Player.make(
			this,
			Vector({x: 12, y: 20}),
			this._inputProvider,
			groundedProvider,
			globalCollidableProvider,
			this._registrar
		);

	}

	globalPosition() {
		return VectorZero;
	}

	draw() {
		this._registrar.getPool(POOL_TYPES.DRAWABLE).foreach(item => item.draw(camera));
		if (debugOptions.showHitboxes) this._registrar.getPool(POOL_TYPES.DRAWABLE_DEBUG).foreach(item => item.draw(camera));
	}

	update() {
		this._trueTime.tick();
		this._inputProvider.update();


		if (this._inputProvider.getInput().pausePressed)
			this._trueTime.togglePause();

		if (this._inputProvider.getInput().resetPressed)
			this._resettablePool.resetAll();

		if (this._inputProvider.getInput().debugPressed)
			toggleDebugAll();

		if (this._inputProvider.getInput().debugHitboxesPressed)
			debugOptions.showHitboxes = !debugOptions.showHitboxes;
		
		
		if (!this._trueTime.getPaused())
			this._registrar
				.getPool(POOL_TYPES.UPDATEABLE)
				.foreach(
					item => item.update(this._trueTime)
				);
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
		new InputProvider(),
		new Registrar(PoolTypesFactory())
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