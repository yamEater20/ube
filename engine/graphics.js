import { Vector } from "./math.js";

// const PIXEL_GAME_SIZE = Vector({x: 256, y: 144});
const PIXEL_GAME_SIZE = Vector({x: 128, y: 128});
const TILE_SIZE = 8;

function createScreenBufferCanvas() {
	const info = createCanvas(true, PIXEL_GAME_SIZE.scalar(4));
	const canvas = info.canvas;
	
	canvas.ondblclick = () => {
        toggleFullscreen();
    };
	setMaxSize(canvas, info.ctx);

	return info;
}

function createCanvas(isVisible, size) {
	size = size ?? PIXEL_GAME_SIZE;
    
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	canvas.width = size.x;
	canvas.height = size.y;
	
	ctx.imageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;
	
	if (!isVisible) canvas.style.display = "none";

	document.body.insertBefore(canvas, document.body.childNodes[0]);
	
	return {
		ctx: ctx,
		canvas: canvas
	};
}

function setMaxSize(canvas, ctx) {
	const screenHeight = document.body.scrollHeight;
	const screenWidth = document.body.scrollWidth;
	let canvasHeight = Math.floor(screenHeight / PIXEL_GAME_SIZE.y);
	let canvasWidth = Math.floor(screenWidth / PIXEL_GAME_SIZE.x);

	const smallestRatio = Math.min(canvasWidth, canvasHeight);

	canvasWidth = smallestRatio * PIXEL_GAME_SIZE.x;
	canvasHeight = smallestRatio * PIXEL_GAME_SIZE.y;
	canvas.style.width = canvasWidth + "px";
	canvas.style.height = canvasHeight + "px";
	canvas.style.backgroundSize = canvasHeight + "px";

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	
	ctx.imageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;

	return smallestRatio;
}

const toggleFullscreen = (event) => {
	const fullScreen = document.fullscreenElement;
	if (fullScreen) {
		document.exitFullscreen();
	} else {
		document.documentElement.requestFullscreen();
	}
};

export {
	createScreenBufferCanvas,
    createCanvas,
    setMaxSize,
    PIXEL_GAME_SIZE,
    TILE_SIZE
}