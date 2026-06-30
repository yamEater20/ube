// If you're looking at the code, that's awesome!
// (You can also find the repo at https://github.com/yamEater20/ube)
// From Yam (the Dev)

import {
	Direction,
	Vector,
    VectorDown,
    VectorLeft,
    VectorOne,
    VectorRight,
    VectorUp,
    VectorZero
} from './engine/math.js';
import { Diagnostics, timeIt } from './engine/diagnostics.js';
import { Registrar, Pool } from './engine/pools.js';
import { POOL_TYPES, PoolTypesFactory } from './entities/poolTypes.js';
import { CollidableProvider } from './services/collidableProvider.js';
import {Camera, DummyCamera} from './engine/camera.js';
import * as UpdateHandlers from './services/customUpdateHandlers.js';
import * as Player from './entities/player.js';
import { Room, ROOM_SIZE_TILES } from './entities/room.js';
import * as Setup from './engine/setup.js';
import { clearCanvas, createCanvas, createFrontBufferCanvas as createScreenBufferCanvas, PIXEL_GAME_SIZE, setMaxSize, TILE_SIZE } from './engine/graphics.js';
import { makeRoomCollider } from './entities/roomCollider.js';
import { EntityDataToEntityFactoryPostProcess as EntityDataToEntityFactoryPostProcess, GeneralPostProcess, LevelDataPostProcessor } from './levelEditor/postProcess.js';
import * as CustomPostProcess from './services/customPostProcessTileArrays.js';
import { ENTITY_MAP, ENTITY_TYPE_TO_ENTITY } from './entities/parseEntityData.js';
import { RegistrarWithRooms, CollidableProviderWithRooms, RoomIndicesProvider } from './services/roomPools.js';
import { SpawnPositionProvider } from './services/spawnPositionProvider.js';
import { RoomsPool } from './services/roomPools.js';
import { Root } from './entities/root.js';
import { ParticlePool } from './services/particlePool.js';
import { BUILD_MODES } from './engine/debug.js';
import * as Factories from './factories.js';
import { DummyScreenShakeOffsetProvider, ScreenShakeOffsetProvider } from './services/cameraServices.js';
import { createProgressBar } from './entities/progressBar.js';
import { PlayerVFXManager } from './services/playerVFXManager.js';

const LEVEL_PATH = "Levels.png";

const CURRENT_BUILD_MODE = BUILD_MODES.LOCAL;
// const CURRENT_BUILD_MODE = BUILD_MODES.LOAD_TEST;
// const CURRENT_BUILD_MODE = BUILD_MODES.PRODUCTION;

//TODO: somehow match different entities to different layers

const INITIAL_ROOM_INDEX = 12;

let root;
let worldCameraInfos;
let screenBufferCameraInfo;

;(async function () {
	timeIt("Total setup", setup);
})();

function mainLoop() {
	updateAll();
	drawBackBuffers();
	drawScreenBuffer();
}

function updateAll() {
	root.update();
}

function drawBackBuffers() {
	worldCameraInfos.forEach(i => clearCanvas(i.canvasInfo))
	root.draw();
}

function drawScreenBuffer() {
	const screenBufferCanvasInfo = screenBufferCameraInfo.canvasInfo;

	clearCanvas(screenBufferCanvasInfo);
	
	const scale = setMaxSize(screenBufferCanvasInfo.canvas, screenBufferCanvasInfo.ctx);
	
	worldCameraInfos.forEach(i => {
		const subpixels = i.camera.getSubPixels();
		screenBufferCameraInfo.camera.drawCanvas(i.canvasInfo.canvas, scale, subpixels);
	});
}

async function setup() {
	const loops = Factories.loopFactory(CURRENT_BUILD_MODE, mainLoop, updateAll, drawBackBuffers, drawScreenBuffer);
	const mainLoopDiagnostics = new Diagnostics(loops.mainLoop);

	const poolDict = PoolTypesFactory();
	poolDict[POOL_TYPES.CAMERA_FOLLOW] = new Pool();
	const persistentRegistrar = new Registrar(poolDict);
	
	const screenShakeOffsetProvider = new ScreenShakeOffsetProvider();
	const drawableRoomIndicesProvider = new RoomIndicesProvider(INITIAL_ROOM_INDEX);

	const roomsPool = new RoomsPool(drawableRoomIndicesProvider, INITIAL_ROOM_INDEX);
	
	const inputProvider = Factories.inputProviderFactory(CURRENT_BUILD_MODE);

	const registrarWithRooms = new RegistrarWithRooms(persistentRegistrar, roomsPool);
	const globalCollidableProvider = new CollidableProviderWithRooms(
		new CollidableProvider(
			persistentRegistrar.getPool(POOL_TYPES.COLLIDABLE)
		),
		roomsPool
	);
	const groundedProvider = new UpdateHandlers.GroundedProvider(globalCollidableProvider);

	drawableRoomIndicesProvider.isCameraShaking = screenShakeOffsetProvider.isShaking;
	drawableRoomIndicesProvider.isCameraMoving = () => worldCameraInfos[2].camera.isMoving;
	
	const particlePool = new ParticlePool(globalCollidableProvider, groundedProvider, root);
	persistentRegistrar.registerEntity(particlePool.getDataToRegister());
	
	const getCameraFollow = () => registrarWithRooms.getPool(POOL_TYPES.CAMERA_FOLLOW).get()[0];

	const cameraInitialPosition = Vector({x: 128*2, y: 128*2});
	worldCameraInfos = Factories.camerasFactory(
		cameraInitialPosition,
		getCameraFollow,
		[0.05, 0.1, 1],
		false,
		screenShakeOffsetProvider
	);

	root = new Root(
		Factories.timeFactory(CURRENT_BUILD_MODE),
		Factories.timeFactory(CURRENT_BUILD_MODE),
		worldCameraInfos,
		inputProvider,
		registrarWithRooms
	);

	const screenBufferCanvasInfo = createScreenBufferCanvas();
	screenBufferCameraInfo = {
		canvasInfo: screenBufferCanvasInfo,
		camera: new Camera(
			screenBufferCanvasInfo.ctx,
			cameraInitialPosition,
			() => root,
			screenShakeOffsetProvider
		)
	};

	const entityConstructionPostProcessor = new LevelDataPostProcessor([
		new CustomPostProcess.SpringCallbackPostProcess(particlePool.createParticles),
		new EntityDataToEntityFactoryPostProcess(ENTITY_TYPE_TO_ENTITY)
	]);

	const levelBuilder = Factories.levelBuilderFactory(CURRENT_BUILD_MODE, LEVEL_PATH, entityConstructionPostProcessor);
	const levelData = await levelBuilder.buildLevels();
	roomsPool.setRooms(levelData.levels.map(data => 
		new Room(
			root,
			ROOM_SIZE_TILES.scalar(TILE_SIZE).multElementWise(data),
			data,
			globalCollidableProvider
		)
	));

	drawableRoomIndicesProvider.setMapGraph(levelData.mapGraph);

	roomsPool.foreach((room, index) => {
		const roomSizeWorldSpace = ROOM_SIZE_TILES.scalar(TILE_SIZE);
		persistentRegistrar.registerEntity(makeRoomCollider(room, index, roomSizeWorldSpace));
	});

	const playerVFXManager = new PlayerVFXManager(particlePool, root, screenShakeOffsetProvider);

	const player = Player.make(
		root,
		Vector({x: 128*2+40, y: 128*2+40}),
		inputProvider,
		groundedProvider,
		globalCollidableProvider,
		new SpawnPositionProvider(roomsPool),
		playerVFXManager,
		roomCollider => {
			worldCameraInfos.forEach(info => info.camera.isMoving = true);
			// screenShakeOffsetProvider.cancelScreenShake();
			const roomIndex = roomCollider.roomIndex;
			drawableRoomIndicesProvider.newRoomIndex(roomIndex);
			roomsPool.setRoomIndex(roomIndex);
			roomsPool.getCurrentRoom().reset();
		},
		() => root.queueReset()
	);

	root.onCameraMove = camera => {
		const cameraPos = camera._position;

		const playerPhysObj = player[POOL_TYPES.COLLIDABLE][0];
		const playerPos = playerPhysObj.globalPosition();

		const playerWidth = playerPhysObj.hitbox.width;
		const playerHeight = playerPhysObj.hitbox.height;

		const playerExtents = playerPos.add(playerWidth, playerHeight);
		const cameraExtents = cameraPos.addPoint(PIXEL_GAME_SIZE);

		let movingHorizontally = false;

		if (playerExtents.x > cameraExtents.x) {
			playerPhysObj.moveDirection(-1, VectorLeft);
			movingHorizontally = true;
		} else if (playerExtents.y > cameraExtents.y) {
			playerPhysObj.moveDirection(-1, VectorUp);
			playerPhysObj.setYVelocity(Math.min(playerPhysObj.getYVelocity(), -0.13));
		} else if (cameraPos.x > playerPos.x) {
			playerPhysObj.moveDirection(1, VectorRight);
			movingHorizontally = true;
		} else if (cameraPos.y > playerPos.y) {
			playerPhysObj.moveDirection(1, VectorDown);
		}

		if (movingHorizontally && Math.abs(playerPhysObj.getXVelocity()) < 0.13) {
			playerPhysObj.setXVelocity(0);
		}
	};
	
	persistentRegistrar.registerEntity(player);
	persistentRegistrar.registerItem(POOL_TYPES.UPDATEABLE, screenShakeOffsetProvider);

	const a = Factories.drawEdgesAroundWorld(levelData, root, 12, "black");
	a.forEach(item => persistentRegistrar.registerItem(POOL_TYPES.DRAWABLE, {item: item, layer: 0}));

	if (CURRENT_BUILD_MODE === BUILD_MODES.LOAD_TEST) {
		persistentRegistrar.registerEntity(
			createProgressBar(
				root,
				Vector({x: 256+8, y: 256+8}),
				loops.getPercentProgress,
				worldCameraInfos[2].camera
			)
		);
	}

	root.queueReset();

	Setup.beginGameLoop(mainLoopDiagnostics.call);
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