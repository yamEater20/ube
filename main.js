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
import * as UpdateHandlers from './entities/customUpdateHandlers.js';
import * as Player from './entities/player.js';
import { Room, ROOM_SIZE_TILES } from './entities/room.js';
import * as Setup from './engine/setup.js';
import {HexToEntityData} from "./levelEditor/hexParsing.js";
import { clearCanvas, createCanvas, setMaxSize, TILE_SIZE } from './engine/graphics.js';
import { CACHED_LEVELS } from './levelEditor/cache.js';
import { makeRoomCollider } from './entities/roomCollider.js';
import { EntityDataToEntityFactoryPostProcess as EntityDataToEntityFactoryPostProcess, GeneralPostProcess, LevelDataPostProcessor } from './levelEditor/postProcess.js';
import * as CustomPostProcess from './entities/customPostProcessTileArrays.js';
import { ENTITY_MAP, ENTITY_TYPE_TO_ENTITY } from './entities/parseEntityData.js';
import { RegistrarWithRooms, CollidableProviderWithRooms } from './services/roomPools.js';
import { SpawnPositionProvider } from './services/spawnPositionProvider.js';
import { RoomsPool } from './services/roomPools.js';
import { Root } from './entities/root.js';
import { ParticlePool } from './services/particlePool.js';
import { LevelBuilderFromImage } from './services/customLevelBuilders.js';

const LEVEL_PATH = "Levels.png";

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

	const info = createCanvas();
	canvas = info.canvas;
	const ctx = info.ctx;
	
	const inputProvider = new InputProvider();

	const poolDict = PoolTypesFactory();
	poolDict[POOL_TYPES.CAMERA_FOLLOW] = new Pool();
	const persistentRegistrar = new Registrar(poolDict);
	
	const orphanedCollidableProvider = new CollidableProvider(persistentRegistrar.getPool(POOL_TYPES.COLLIDABLE));

	const roomsPool = new RoomsPool();
	
	const registrarWithRooms = new RegistrarWithRooms(persistentRegistrar, roomsPool);
	const collidableProviderWithRooms = new CollidableProviderWithRooms(orphanedCollidableProvider, roomsPool);
	
	const groundedProvider = new UpdateHandlers.GroundedProvider(collidableProviderWithRooms);

	const particleCreator = new ParticlePool(persistentRegistrar, collidableProviderWithRooms, groundedProvider);

	const camera = new Camera(
		ctx,
		Vector({x: 128*2, y: 128*2}),
		() => registrarWithRooms.getPool(POOL_TYPES.CAMERA_FOLLOW).get()[0]
	);

	root = new Root(
		new Time(),
		new Time(),
		camera,
		inputProvider,
		registrarWithRooms
	);

	const postProcessor = new LevelDataPostProcessor([
		new GeneralPostProcess(new HexToEntityData(ENTITY_MAP)),
		new CustomPostProcess.SemiSolidPostProcess(),
		new CustomPostProcess.WallMainPostProcess(),
		new CustomPostProcess.WallCornersPostProcess(),
	]);

	const entityConstructionPostProcessor = new LevelDataPostProcessor([
		new CustomPostProcess.SpringCallbackPostProcess(particleCreator.createSpringParticles),
		new EntityDataToEntityFactoryPostProcess(ENTITY_TYPE_TO_ENTITY)
	]);

	const levelBuilder = new LevelBuilderFromImage(
		LEVEL_PATH,
		[postProcessor, entityConstructionPostProcessor]
	)

	const levelData = await levelBuilder.buildLevels();

	roomsPool.setRooms(levelData.levels.map(data => 
		new Room(
			root,
			ROOM_SIZE_TILES.scalar(TILE_SIZE).multElementWise(data),
			data,
			collidableProviderWithRooms
		)
	));

	const player = Player.make(
		root,
		Vector({x: 128*2+40, y: 128*2+40}),
		inputProvider,
		groundedProvider,
		collidableProviderWithRooms,
		new SpawnPositionProvider(roomsPool),
		roomCollider => roomsPool.roomIndex = roomCollider.roomIndex,
		() => root.queueReset()
	);
	
	persistentRegistrar.registerEntity(player);

	roomsPool.foreach((room, index) => {
		const roomSizeWorldSpace = ROOM_SIZE_TILES.scalar(TILE_SIZE);
		persistentRegistrar.registerEntity(makeRoomCollider(room, index, roomSizeWorldSpace));
	});

	// timeIt("Build levels", () => game.buildLevels(levelData));
	particleCreator.createSpringParticles(roomsPool.get()[5 * 2 + 2], Vector({x: 50, y: 50}));
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