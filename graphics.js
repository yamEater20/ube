const PIXEL_GAME_SIZE = [256, 144];
const TILE_SIZE = 8;

const canvas = document.createElement("canvas");
const CTX = canvas.getContext("2d");
canvas.width = PIXEL_GAME_SIZE[0];
canvas.height = PIXEL_GAME_SIZE[1];
document.body.insertBefore(canvas, document.body.childNodes[0]);
function setupCanvas() {
    canvas.style.backgroundImage = 'url("images/Background.png")';
	CTX.imageSmoothingEnabled = false;
    canvas.ondblclick = () => {
        toggleFullscreen();
    };
	setMaxSize();
}

function setMaxSize() {
	const screenHeight = document.body.scrollHeight;
	const screenWidth = document.body.scrollWidth;
	let canvasHeight = Math.floor(screenHeight / PIXEL_GAME_SIZE[1]);
	let canvasWidth = Math.floor(screenWidth / PIXEL_GAME_SIZE[0]);

	const smallestRatio = Math.min(canvasWidth, canvasHeight);

	canvasWidth = smallestRatio * PIXEL_GAME_SIZE[0];
	canvasHeight = smallestRatio * PIXEL_GAME_SIZE[1];
	canvas.style.width = canvasWidth + "px";
	canvas.style.height = canvasHeight + "px";
	canvas.style.backgroundSize = canvasHeight + "px";
}

function clearCanvas() {
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
    CTX,
    clearCanvas,
    setupCanvas,
    setMaxSize,
    PIXEL_GAME_SIZE,
    TILE_SIZE
}