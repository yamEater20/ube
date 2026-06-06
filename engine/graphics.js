import { Vector } from "./math.js";

// const PIXEL_GAME_SIZE = Vector({x: 256, y: 144});
const PIXEL_GAME_SIZE = Vector({x: 128, y: 128});
const TILE_SIZE = 8;

function createCanvas() {
    const canvas = document.createElement("canvas");
	const CTX = canvas.getContext("2d");
	canvas.width = PIXEL_GAME_SIZE.x;
	canvas.height = PIXEL_GAME_SIZE.y;
	document.body.insertBefore(canvas, document.body.childNodes[0]);
	CTX.imageSmoothingEnabled = false;

	canvas.style.backgroundImage = 'url("images/Background.png")';
    canvas.ondblclick = () => {
        toggleFullscreen();
    };
	setMaxSize(canvas);
	return {
		ctx: CTX,
		canvas: canvas
	};
}

function setMaxSize(canvas) {
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
}

function clearCanvas(canvas) {
	canvas.width = canvas.width;
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
    clearCanvas,
    createCanvas,
    setMaxSize,
    PIXEL_GAME_SIZE,
    TILE_SIZE
}