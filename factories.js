import { FixedTimeDeltaTime, Time } from './engine/time.js';
import {Camera, DummyCamera} from './engine/camera.js';
import {InputProvider, TASInputProvider} from './services/input.js';
import {HexToEntityData} from "./levelEditor/hexParsing.js";
import { createCanvas, PIXEL_GAME_SIZE } from './engine/graphics.js';
import { LevelBuilderFromCache, LevelBuilderFromImage } from './services/customLevelBuilders.js';
import { ENTITY_MAP } from './entities/parseEntityData.js';
import { GeneralPostProcess, LevelDataPostProcessor } from './levelEditor/postProcess.js';
import { CACHED_LEVELS } from './levelEditor/cache.js';
import * as CustomPostProcess from './services/customPostProcessTileArrays.js';
import { BUILD_MODES } from './engine/debug.js';

export function camerasFactory(startingPosition, getCameraFollow, depths, visibleCanvas, screenShakeOffsetProvider) {
	return depths.map(parallaxScale => cameraFactory(startingPosition, getCameraFollow, parallaxScale, visibleCanvas, screenShakeOffsetProvider));
}

function cameraFactory(startingPosition, getCameraFollow, depth, visibleCanvas, screenShakeOffsetProvider) {
	const canvasInfo = createCanvas(visibleCanvas, PIXEL_GAME_SIZE.add(1, 1));
	return {
		canvasInfo: canvasInfo,
		camera: new Camera(
			canvasInfo.ctx,
			startingPosition,
			getCameraFollow,
			screenShakeOffsetProvider,
			depth
		)
	}
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
	if (buildMode === BUILD_MODES.LOAD_TEST) {
		return new TASInputProvider();
	}

	return new InputProvider();
}