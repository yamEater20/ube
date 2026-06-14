// If you're looking at the code, that's awesome!
// (You can also find the repo at https://github.com/yamEater20/ube)
// From Yam (the Dev)

import {
	Vector,
    VectorZero
} from './engine/math.js';
import { Time } from './engine/time.js';
import { Diagnostics, timeIt } from './engine/diagnostics.js';
import { Registrar, Pool } from './engine/pools.js';
import { POOL_TYPES, PoolTypesFactory } from './entities/poolTypes.js';
import { CollidableProvider } from './services/collidableProvider.js';
import {Camera} from './engine/camera.js';
import {InputProvider, TASInputProvider} from './services/input.js';
import * as UpdateHandlers from './entities/physUpdateHandlers.js';
import * as Player from './entities/player.js';
import { Room, ROOM_SIZE_TILES } from './entities/room.js';
import * as Setup from './engine/setup.js';
import {toggleDebugAll, debugOptions} from "./engine/debug.js";
import {HexToEntityData} from "./levelEditor/hexParsing.js";
import { getLevelData } from './levelEditor/levelEditor.js';
import { clearCanvas, createCanvas, setMaxSize, TILE_SIZE } from './engine/graphics.js';
import { CACHED_LEVELS } from './levelEditor/cache.js';
import { makeRoomCollider } from './entities/roomCollider.js';
import { EntityDataToEntityFactoryPostProcess as EntityDataToEntityFactoryPostProcess, GeneralPostProcess, LevelDataPostProcessor } from './levelEditor/postProcess.js';
import * as CustomPostProcess from './entities/customPostProcessTileArrays.js';
import { ENTITY_MAP, ENTITY_TYPE_TO_ENTITY } from './entities/parseEntityData.js';

const LEVEL_PATH = "Levels.png";

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

class SpawnPositionProvider {
    constructor(roomsPool) {
        this._roomsPool = roomsPool;
    }

    getSpawnPosition() {
        return this._roomsPool.getPool(POOL_TYPES.SPAWN).get()[0].globalPosition();
    }
}

class RoomsPool extends Pool {
	constructor(items) {
		super(items);
		this.roomIndex = 12;
	}

	getCurrentRoom() {
		return this.get()[this.roomIndex];
	}

	getPool(poolType) {
		// if (debugOptions.showAll && (poolType === POOL_TYPES.DRAWABLE || poolType === POOL_TYPES.DRAWABLE_DEBUG)) {
		// 	return this.get().map(r => r.getPool(poolType)).reduce((a, b) => a.concat(b));
		// }
		if ((poolType === POOL_TYPES.DRAWABLE || poolType === POOL_TYPES.DRAWABLE_DEBUG)) {
			return this.get().map(r => r.getPool(poolType)).reduce((a, b) => a.concat(b));
		}
		return this.getCurrentRoom().getPool(poolType);
		// return this.get().map(r => r.getPool(poolType)).reduce((a, b) => a.concat(b));
	}

	nextRoom() {
		this.roomIndex = (this.roomIndex + 1) % this._items.length;
	}
}

class Root {
	constructor(trueTime, worldTime, camera, inputProvider, registrar) {
		this._trueTime = trueTime;
		this._worldTime = worldTime;
		this._camera = camera;
		this._inputProvider = inputProvider;
		this._registrar = registrar;

		this._worldPaused = false;

		this._shouldReset = false;
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
		this._worldTime.tick();

		this._inputProvider.update();

		const input = this._inputProvider.getInput();

		//Debug only
		if (input.debugPressed) toggleDebugAll();
		if (input.noClipPressed) debugOptions.noClip = !debugOptions.noClip;
		if (input.debugHitboxesPressed) debugOptions.showHitboxes = !debugOptions.showHitboxes;
		if (input.nextRoomPressed) this._registrar.getRoomsPool().nextRoom();
		if (input.showAllPressed) debugOptions.showAll = !debugOptions.showAll;
		
		this._camera.update(this._trueTime.delta);

		if (this._camera.isMoving) {
			//Do not update world time on room Transition
		} else {
			if (input.pausePressed) this._worldPaused = !this._worldPaused;

			if (!this._worldPaused)
			{
				if (input.resetPressed) this.queueReset();
				this._registrar.getPool(POOL_TYPES.UPDATEABLE).foreach(item => item.update(this._worldTime.delta));
			}
		}

		if (this._shouldReset) {
			this._registrar.getPool(POOL_TYPES.RESETTABLE).foreach(r => r.reset());
			this._shouldReset = false;
		}
	}

	queueReset() {
		this._shouldReset = true;
	}
}

class ParticleCreator {
	createSpringParticles(position) {
		console.log(position.x, position.y);
	}
}

let root;
let canvas;

function mainLoop() {
	setMaxSize(canvas);
	clearCanvas(canvas);
	root.update();
	root.draw();
}

let mainLoopDiagnostics = new Diagnostics(mainLoop);

async function setup() {
	// Setup.setup();
	let levelData = await timeIt("Read level data", () => getLevelData(LEVEL_PATH));
	const postProcessor = new LevelDataPostProcessor([
		new GeneralPostProcess(new HexToEntityData(ENTITY_MAP)),
		new CustomPostProcess.SemiSolidPostProcess(),
		new CustomPostProcess.WallMainPostProcess(),
		new CustomPostProcess.WallCornersPostProcess(),
	]);
	levelData = postProcessor.execute(levelData);
	const json = JSON.stringify(levelData);
	console.log(json);

	// let levelData = CACHED_LEVELS;

	const particleCreator = new ParticleCreator();
	
	const entityConstructionPostProcessor = new LevelDataPostProcessor([
		new CustomPostProcess.SpringCallbackPostProcess(particleCreator.createSpringParticles),
		new EntityDataToEntityFactoryPostProcess(ENTITY_TYPE_TO_ENTITY)
	]);

	levelData = entityConstructionPostProcessor.execute(levelData);

	const info = createCanvas();
	canvas = info.canvas;
	const ctx = info.ctx;
	
	const inputProvider = new InputProvider();

	const poolDict = PoolTypesFactory();
	poolDict[POOL_TYPES.CAMERA_FOLLOW] = new Pool();
	const persistentRegistrar = new Registrar(poolDict);
	const orphanedCollidableProvider = new CollidableProvider(persistentRegistrar.getPool(POOL_TYPES.COLLIDABLE));
	const globalRegistrar = new RegistrarWithRooms(persistentRegistrar);
	const globalCollidableProvider = new GlobalCollidableProvider(orphanedCollidableProvider);
	const groundedProvider = new UpdateHandlers.GroundedProvider(globalCollidableProvider);

	const camera = new Camera(
		ctx,
		Vector({x: 128*2, y: 128*2}),
		() => globalRegistrar.getPool(POOL_TYPES.CAMERA_FOLLOW).get()[0]
	);

	root = new Root(
		new Time(),
		new Time(),
		camera,
		inputProvider,
		globalRegistrar
	);

	const roomsPool = new RoomsPool(levelData.levels.map(data => 
		new Room(
			root,
			ROOM_SIZE_TILES.scalar(TILE_SIZE).multElementWise(data),
			data,
			globalCollidableProvider
		)
	));

	const player = Player.make(
		root,
		Vector({x: 128*2+40, y: 128*2+40}),
		inputProvider,
		groundedProvider,
		globalCollidableProvider,
		new SpawnPositionProvider(roomsPool),
		roomCollider => roomsPool.roomIndex = roomCollider.roomIndex,
		() => root.queueReset()
	);
	
	persistentRegistrar.registerEntity(player);

	roomsPool.foreach((room, index) => {
		const roomSizeWorldSpace = ROOM_SIZE_TILES.scalar(TILE_SIZE);
		persistentRegistrar.registerEntity(makeRoomCollider(room, index, roomSizeWorldSpace));
	});

	globalRegistrar.setRoomsPool(roomsPool);
	globalCollidableProvider.setRoomsPool(roomsPool);
	
	// timeIt("Build levels", () => game.buildLevels(levelData));

	root.queueReset();
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