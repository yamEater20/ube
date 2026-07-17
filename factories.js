import { FixedTimeDeltaTime, Time } from './engine/time.js';
import {Camera, DummyCamera} from './engine/camera.js';
import {BufferedInput, InputProviderWithPresses, KeyboardInputProvider, TASInputProvider} from './services/customInputProviders.js';
import {HexToEntityData} from "./levelEditor/hexParsing.js";
import { createCanvas, PIXEL_GAME_SIZE, TILE_SIZE } from './engine/graphics.js';
import { LevelBuilderFromCache, LevelBuilderFromImage } from './services/customLevelBuilders.js';
import { ENTITY_MAP } from './entities/parseEntityData.js';
import { GeneralPostProcess, LevelDataPostProcessor } from './levelEditor/postProcess.js';
import { CACHED_LEVELS } from './levelEditor/cache.js';
import * as CustomPostProcess from './services/customPostProcessTileArrays.js';
import { BUILD_MODES } from './engine/debug.js';
import { ROOM_SIZE_TILES } from './entities/room.js';
import { RectDrawable } from './services/customDrawables.js';
import { framesToMs, Vector } from './engine/math.js';
import { DrawableEntity } from './engine/drawableEntity.js';
import { CanvasRenderTarget } from './engine/renderTarget.js';

export function camerasFactory(startingPosition, getCameraFollow, depths, visibleCanvas, screenShakeOffsetProvider) {
	return depths.map(
		parallaxScale => cameraFactory(
			startingPosition,
			getCameraFollow,
			parallaxScale,
			visibleCanvas,
			screenShakeOffsetProvider
		)
	);
}

function cameraFactory(startingPosition, getCameraFollow, depth, visibleCanvas, screenShakeOffsetProvider) {
	const canvasInfo = createCanvas(visibleCanvas, PIXEL_GAME_SIZE.add(1, 1));
	const renderTarget = new CanvasRenderTarget(canvasInfo.canvas, canvasInfo.ctx);
	return new Camera(
		renderTarget,
		startingPosition,
		getCameraFollow,
		screenShakeOffsetProvider,
		depth
	)
}

export function timeFactory(buildMode) {
	return buildMode === BUILD_MODES.LOAD_TEST
		? new FixedTimeDeltaTime(16)
		: new Time();
}

export function loopFactory(buildMode, mainLoop, updateAll, drawBackBuffers, drawScreenBuffer) {
	const numFrames = 30000;
	let curNumFramesRemaining = numFrames;
	const frameTime = 16;

	let hasPrintedPerformance = false;

	if (buildMode === BUILD_MODES.LOAD_TEST) {
		return {
			mainLoop: () => {
				const frameStartTime = window.performance.now();
				while (window.performance.now() - frameStartTime < frameTime && curNumFramesRemaining > 0) {
					updateAll();
					drawBackBuffers();
					curNumFramesRemaining--;
				}
				if (curNumFramesRemaining <= 0 && !hasPrintedPerformance) {
					const numSeconds = window.performance.now() / 1000;
					console.log(`Rendered ${numFrames} frames in ${numSeconds} seconds. FPS: ${Math.floor(numFrames/numSeconds)}`);
					hasPrintedPerformance = true;
				}
				drawScreenBuffer();
			},
			getPercentProgress: () => 1 - curNumFramesRemaining / numFrames
		}
	}

	return {
		mainLoop: mainLoop
	};
}

export function levelBuilderFactory(buildMode, levelPath, entityConstructionPostProcessor) {
	const postProcessor = new LevelDataPostProcessor([
		new GeneralPostProcess(new HexToEntityData(ENTITY_MAP)),
		new CustomPostProcess.SemiSolidPostProcess(),
		new CustomPostProcess.WallMainPostProcess(),
		new CustomPostProcess.WallCornersPostProcess(),
	]);

	if (buildMode === BUILD_MODES.PRODUCTION)
		return new LevelBuilderFromCache(CACHED_LEVELS, entityConstructionPostProcessor);

	return new LevelBuilderFromImage(
		levelPath,
		[postProcessor, entityConstructionPostProcessor]
	);
}

export function inputProviderFactory(buildMode) {
	const pressCodes = [
		"jump",
		"slide",
		"pause",
		"reset",
		
		"debug",
		"debugHitboxes",
		"noClip",
		"showAll",
		"nextRoom"
	];

	const bufferCodes = [
		"jump",
		"slide"
	];

	const bufferMs = framesToMs(8);
	
	if (buildMode === BUILD_MODES.LOAD_TEST) {
		return new BufferedInput(
			new TASInputProvider(),
			bufferCodes,
			bufferMs
		);
	}

	return new BufferedInput(
		new InputProviderWithPresses(
			new KeyboardInputProvider(),
			pressCodes
		),
		bufferCodes,
		bufferMs
	);
}

// Draw 4 rectangles around the empty space formed by the world
// Prevents screenshake from exposing emptiness
export function drawEdgesAroundWorld(levelData, root, offset, color) {
	//Assumes the world is one big rectangle.
	const worldLevelLocations = levelData.worldLevelLocations;
	const locationsX = worldLevelLocations.map(p => p.x);
	const locationsY = worldLevelLocations.map(p => p.y);
	const minLevelLocationX = Math.min(...locationsX);
	const minLevelLocationY = Math.min(...locationsY);

	const maxLevelLocationX = Math.max(...locationsX) + ROOM_SIZE_TILES.x * TILE_SIZE;
	const maxLevelLocationY = Math.max(...locationsY) + ROOM_SIZE_TILES.y * TILE_SIZE;

	/*
	_________  ______  __________
	|		 | |SMALL| |		 |
	|		 | _______ |		 |
	|BIG_LEFT| [WORLD] |BIG_RIGHT|
	|		 | _______ |	     |
	[________| |SMALL| |_________|
	*/

	const worldSize = Vector({x: maxLevelLocationX - minLevelLocationX, y: maxLevelLocationY - minLevelLocationY});
	const bigSize = Vector({x: offset, y: worldSize.y + offset * 2});
	const smallSize = Vector({x: worldSize.x, y: offset});

	const bigLeft = new DrawableEntity(
		root,
		new RectDrawable(bigSize, color),
		Vector({x: minLevelLocationX - offset, y: minLevelLocationY - offset})
	);

	const smallBottom = new DrawableEntity(
		root,
		new RectDrawable(smallSize, color),
		Vector({x: minLevelLocationX, y: minLevelLocationY - offset})
	);

	const smallTop = new DrawableEntity(
		root,
		new RectDrawable(smallSize, color),
		Vector({x: minLevelLocationX, y: maxLevelLocationY})
	);

	const bigRight = new DrawableEntity(
		root,
		new RectDrawable(bigSize, color),
		Vector({x: maxLevelLocationX, y: minLevelLocationY - offset})
	);

	return [bigLeft, smallBottom, smallTop, bigRight];
}