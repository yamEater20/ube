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
import {Camera} from './camera.js';
import {InputProvider, TASInputProvider} from './input.js';
import * as UpdateHandlers from './physUpdateHandlers.js';
import * as Player from './player.js';
import { Room, ROOM_SIZE_TILES } from './world.js';
import * as Setup from './engine/setup.js';
import {toggleDebugAll, debugOptions} from "./engine/debug.js";
import { getLevelData } from './levelEditor/levelEditor.js';
import { postProcessWalls } from './levelEditor/postProcess.js';
import { TILE_SIZE } from './engine/graphics.js';
import { CACHED_LEVELS } from './levelEditor/cache.js';
import { makeRoomCollider } from './entities/roomCollider.js';

class RegistrarWithRooms {
	constructor(registrar) {
		this._registrar = registrar;
	}

	setRoomsPool(r) {this._roomsPool = r;}
	getRoomsPool() {return this._roomsPool;}

	getPool(poolType) {
		return this._registrar.getPool(poolType).concat(this._roomsPool.getPool(poolType));
	}

	registerItem(poolType, object) {
		this._registrar.registerItem(poolType, object);
	}
}

class GlobalCollidableProvider {
	constructor(persistentCollidableProvider) {
		this._persistentCollidableProvider = persistentCollidableProvider;
	}

	setRoomsPool(r) {this._roomsPool = r;}
	getRoomsPool() {return this._roomsPool;}

	getAllRiding(physObj) {
		if (debugOptions.showAll) {
			return this._roomsPool.get().map(r => r.getLocalCollidableProvider().getAllColliding(physObj, offset)).reduce((a, b) => a.concat(b))
				.concat(this._persistentCollidableProvider.getAllColliding(physObj, offset));
		}
		
		return this
			._roomsPool.getCurrentRoom().getLocalCollidableProvider().getAllRiding(physObj)
			.concat(this._persistentCollidableProvider.getAllRiding(physObj));
	}

	getAllColliding(physObj, offset) {
		if (debugOptions.showAll) {
			return this._roomsPool.get().map(r => r.getLocalCollidableProvider().getAllColliding(physObj, offset)).reduce((a, b) => a.concat(b))
				.concat(this._persistentCollidableProvider.getAllColliding(physObj, offset));
		}
		
		return this
			._roomsPool.getCurrentRoom().getLocalCollidableProvider().getAllColliding(physObj, offset)
			.concat(this._persistentCollidableProvider.getAllColliding(physObj, offset))
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
		if (debugOptions.showAll && (poolType === POOL_TYPES.DRAWABLE || poolType === POOL_TYPES.DRAWABLE_DEBUG)) {
			return this.get().map(r => r.getPool(poolType)).reduce((a, b) => a.concat(b));
		}
		return this.getCurrentRoom().getPool(poolType);
	}

	nextRoom() {
		this.roomIndex = (this.roomIndex + 1) % this._items.length;
	}
}

class Root {
	constructor(trueTime, camera, inputProvider, registrar) {
		this._trueTime = trueTime;
		this._camera = camera;
		this._inputProvider = inputProvider;
		this._registrar = registrar;
	}

	globalPosition() {
		return VectorZero;
	}

	draw() {
		this._registrar.getPool(POOL_TYPES.DRAWABLE).foreach(item => item.draw(this._camera));
		if (debugOptions.showHitboxes) this._registrar.getPool(POOL_TYPES.DRAWABLE_DEBUG).foreach(item => item.draw(this._camera));
	}

	update() {
		this._trueTime.tick();
		this._inputProvider.update();

		const input = this._inputProvider.getInput();

		if (input.pausePressed) this._trueTime.togglePause();
		if (input.resetPressed) this._registrar.getPool(POOL_TYPES.RESETTABLE).foreach(r => r.reset());

		//Debug only
		if (input.debugPressed) toggleDebugAll();
		if (input.noClipPressed) debugOptions.noClip = !debugOptions.noClip;
		if (input.debugHitboxesPressed) debugOptions.showHitboxes = !debugOptions.showHitboxes;
		if (input.nextRoomPressed) this._registrar.getRoomsPool().nextRoom();
		if (input.showAllPressed) debugOptions.showAll = !debugOptions.showAll;
		
		if (!this._trueTime.getPaused())
		{
			this._registrar.getPool(POOL_TYPES.UPDATEABLE).foreach(item => item.update(this._trueTime));
		}
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
	// let levelData = await timeIt("Read level data", getLevelData);
	// const json = JSON.stringify(levelData);
	// console.log(json);
	let levelData = CACHED_LEVELS;
   

	levelData.levels = levelData.levels.map(postProcessWalls);
	
	const inputProvider = new InputProvider();

	const poolDict = PoolTypesFactory();
	poolDict[POOL_TYPES.CAMERA_FOLLOW] = new Pool();
	const persistentRegistrar = new Registrar(poolDict);
	const orphanedCollidableProvider = new CollidableProvider(persistentRegistrar.getPool(POOL_TYPES.COLLIDABLE));
	const globalRegistrar = new RegistrarWithRooms(persistentRegistrar);
	const globalCollidableProvider = new GlobalCollidableProvider(orphanedCollidableProvider);
	const groundedProvider = new UpdateHandlers.GroundedProvider(globalCollidableProvider);

	const camera = new Camera(persistentRegistrar.getPool(POOL_TYPES.CAMERA_FOLLOW));

	root = new Root(
		new Time(),
		camera,
		inputProvider,
		globalRegistrar
	);

	const player = Player.make(
		root,
		Vector({x: 32, y: 98}),
		inputProvider,
		groundedProvider,
		globalCollidableProvider,
		globalRegistrar
	);
	
	persistentRegistrar.registerEntity(player);
	persistentRegistrar.registerItem(POOL_TYPES.UPDATEABLE, camera);

	const roomsPool = new RoomsPool(levelData.levels.map(data => 
		new Room(
			root,
			ROOM_SIZE_TILES.scalar(TILE_SIZE).multElementWise(data),
			data,
			globalCollidableProvider
		)
	));

	roomsPool.foreach(room =>
		persistentRegistrar.registerEntity(makeRoomCollider(room, ROOM_SIZE_TILES.scalar(TILE_SIZE)))
	);
	globalRegistrar.setRoomsPool(roomsPool);
	globalCollidableProvider.setRoomsPool(roomsPool);
	
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