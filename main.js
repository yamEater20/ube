// If you're looking at the code, that's awesome!
// (You can also find the repo at https://github.com/yamEater20/ube)
// From Yam (the Dev)

import {
	Vector,
    VectorDown,
    VectorLeft,
    VectorRight,
    VectorUp,
    VectorZero
} from './engine/math.js';
import { FixedTimeDeltaTime, Time } from './engine/time.js';
import { Diagnostics, timeIt } from './engine/diagnostics.js';
import { Registrar, Pool } from './engine/pools.js';
import { POOL_TYPES, PoolTypesFactory } from './entities/poolTypes.js';
import { CollidableProvider } from './services/collidableProvider.js';
import {Camera, DummyCamera} from './engine/camera.js';
import {InputProvider, TASInputProvider} from './services/input.js';
import * as UpdateHandlers from './services/customUpdateHandlers.js';
import * as Player from './entities/player.js';
import { Room, ROOM_SIZE_TILES } from './entities/room.js';
import * as Setup from './engine/setup.js';
import {HexToEntityData} from "./levelEditor/hexParsing.js";
import { clearCanvas, createCanvas, createFrontBufferCanvas, PIXEL_GAME_SIZE, setMaxSize, TILE_SIZE } from './engine/graphics.js';
import { CACHED_LEVELS } from './levelEditor/cache.js';
import { makeRoomCollider } from './entities/roomCollider.js';
import { EntityDataToEntityFactoryPostProcess as EntityDataToEntityFactoryPostProcess, GeneralPostProcess, LevelDataPostProcessor } from './levelEditor/postProcess.js';
import * as CustomPostProcess from './services/customPostProcessTileArrays.js';
import { ENTITY_MAP, ENTITY_TYPE_TO_ENTITY } from './entities/parseEntityData.js';
import { RegistrarWithRooms, CollidableProviderWithRooms } from './services/roomPools.js';
import { SpawnPositionProvider } from './services/spawnPositionProvider.js';
import { RoomsPool } from './services/roomPools.js';
import { Root } from './entities/root.js';
import { ParticlePool } from './services/particlePool.js';
import { LevelBuilderFromCache, LevelBuilderFromImage } from './services/customLevelBuilders.js';
import { BUILD_MODES, buildMode } from './engine/debug.js';

const LEVEL_PATH = "Levels.png";

let root;
let screenBufferCanvasInfo;
let mainBufferCanvasInfo;
let worldMidgroundBufferCanvasInfo;
let worldMidground2BufferCanvasInfo;

let screenBufferCamera;
let worldMainCamera;
let worldMidgroundCamera;
let worldMidground2Camera;

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
	clearCanvas(mainBufferCanvasInfo);
	clearCanvas(worldMidgroundBufferCanvasInfo);
	clearCanvas(worldMidground2BufferCanvasInfo);
	root.draw();
}

function drawScreenBuffer() {
	clearCanvas(screenBufferCanvasInfo);
	const scale = setMaxSize(screenBufferCanvasInfo.canvas, screenBufferCanvasInfo.ctx);
	
	const subpixels = worldMainCamera.getSubPixels();
	const midSubpixels = worldMidgroundCamera.getSubPixels();
	const mid2Subpixels = worldMidground2Camera.getSubPixels();
	
	screenBufferCamera.drawCanvas(worldMidgroundBufferCanvasInfo.canvas, scale, midSubpixels);
	screenBufferCamera.drawCanvas(worldMidground2BufferCanvasInfo.canvas, scale, mid2Subpixels);
	screenBufferCamera.drawCanvas(mainBufferCanvasInfo.canvas, scale, subpixels);
}

async function setup() {
	const mainLoopDiagnostics = new Diagnostics(loopFactory(buildMode));

	const inputProvider = inputProviderFactory(buildMode);

	screenBufferCanvasInfo = createFrontBufferCanvas();
	mainBufferCanvasInfo = createCanvas(true, PIXEL_GAME_SIZE.add(1, 1));
	worldMidgroundBufferCanvasInfo = createCanvas(true, PIXEL_GAME_SIZE.add(1, 1));
	worldMidground2BufferCanvasInfo = createCanvas(true, PIXEL_GAME_SIZE.add(1, 1));

	const poolDict = PoolTypesFactory();
	poolDict[POOL_TYPES.CAMERA_FOLLOW] = new Pool();
	const persistentRegistrar = new Registrar(poolDict);
	
	const orphanedCollidableProvider = new CollidableProvider(persistentRegistrar.getPool(POOL_TYPES.COLLIDABLE));

	const roomsPool = new RoomsPool(12);
	
	const registrarWithRooms = new RegistrarWithRooms(persistentRegistrar, roomsPool);
	const collidableProviderWithRooms = new CollidableProviderWithRooms(orphanedCollidableProvider, roomsPool);
	
	const groundedProvider = new UpdateHandlers.GroundedProvider(collidableProviderWithRooms);

	const particlePool = new ParticlePool(collidableProviderWithRooms, groundedProvider);
	persistentRegistrar.registerEntity(particlePool.getDataToRegister());

	const getCameraFollow = () => registrarWithRooms.getPool(POOL_TYPES.CAMERA_FOLLOW).get()[0];

	worldMainCamera = new Camera(
		mainBufferCanvasInfo.ctx,
		Vector({x: 128*2, y: 128*2}),
		getCameraFollow
	);

	worldMidgroundCamera = new Camera(
		worldMidgroundBufferCanvasInfo.ctx,
		Vector({x: 128*2, y: 128*2}),
		getCameraFollow,
		0.05
	);

	worldMidground2Camera = new Camera(
		worldMidground2BufferCanvasInfo.ctx,
		Vector({x: 128*2, y: 128*2}),
		getCameraFollow,
		0.1
	);

	screenBufferCamera = new Camera(
		screenBufferCanvasInfo.ctx,
		Vector({x: 128*2, y: 128*2}),
		() => root
	);

	root = new Root(
		timeFactory(buildMode),
		timeFactory(buildMode),
		worldMainCamera,
		worldMidgroundCamera,
		worldMidground2Camera,
		inputProvider,
		registrarWithRooms
	);

	const entityConstructionPostProcessor = new LevelDataPostProcessor([
		new CustomPostProcess.SpringCallbackPostProcess(particlePool.createSpringParticles),
		new EntityDataToEntityFactoryPostProcess(ENTITY_TYPE_TO_ENTITY)
	]);

	const levelBuilder = levelBuilderFactory(buildMode, entityConstructionPostProcessor);
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
		roomCollider => {
			roomsPool.setRoomIndex(roomCollider.roomIndex);
			roomsPool.getCurrentRoom().reset();
		},
		() => root.queueReset()
	);

	root.onCameraMove = camera => {
		const cameraPos = camera._position;
		// console.log(cameraPos.x,cameraPos.y);

		const playerPhysObj = player[POOL_TYPES.COLLIDABLE][0];
		const playerPos = playerPhysObj.globalPosition();

		// console.log(playerPos.x, playerPos.y);
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

	roomsPool.foreach((room, index) => {
		const roomSizeWorldSpace = ROOM_SIZE_TILES.scalar(TILE_SIZE);
		persistentRegistrar.registerEntity(makeRoomCollider(room, index, roomSizeWorldSpace));
	});

	root.queueReset();

	Setup.beginGameLoop(mainLoopDiagnostics.call);
}

function timeFactory(buildMode) {
	return buildMode === BUILD_MODES.LOAD_TEST
		? new FixedTimeDeltaTime(16)
		: new Time();
}

function loopFactory(buildMode) {
	const numFrames = 30000;
	let curNumFrames = numFrames;
	const frameTime = 16;

	let hasPrintedPerformance = false;

	if (buildMode === BUILD_MODES.LOAD_TEST) {
		return () => {
			const frameStartTime = window.performance.now();
			while (window.performance.now() - frameStartTime < frameTime && curNumFrames > 0) {
				updateAll();
				drawBackBuffers();
				curNumFrames--;
			}
			if (curNumFrames <= 0 && !hasPrintedPerformance) {
				const numSeconds = window.performance.now() / 1000;
				console.log(`Rendered ${numFrames} frames in ${numSeconds} seconds. FPS: ${Math.floor(numFrames/numSeconds)}`);
				hasPrintedPerformance = true;
			}
			drawScreenBuffer();
		}
	}

	return mainLoop;
}

function levelBuilderFactory(buildMode, entityConstructionPostProcessor) {
	const postProcessor = new LevelDataPostProcessor([
		new GeneralPostProcess(new HexToEntityData(ENTITY_MAP)),
		new CustomPostProcess.SemiSolidPostProcess(),
		new CustomPostProcess.WallMainPostProcess(),
		new CustomPostProcess.WallCornersPostProcess(),
	]);

	if (buildMode === BUILD_MODES.PRODUCTION)
		return new LevelBuilderFromCache(CACHED_LEVELS, entityConstructionPostProcessor);

	return new LevelBuilderFromImage(
		LEVEL_PATH,
		[postProcessor, entityConstructionPostProcessor]
	);
}

function inputProviderFactory(buildMode) {
	if (buildMode === BUILD_MODES.LOAD_TEST) {
		return new TASInputProvider();
	}

	return new InputProvider();
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