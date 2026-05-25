import * as Graphics from "./graphics.js";

let customLoop;

//Always call this!!!!
export function setup() {
    Graphics.setupCanvas();
}

//Only call this once!!!
export function beginGameLoop(loop) {
    customLoop = loop;
    main();
}

//Calls itself every frame after being invoked once
function main() {
	const stopMain = window.requestAnimationFrame(main);
    mainLoop();
}

function mainLoop() {
	Graphics.setMaxSize();
	Graphics.clearCanvas();
    customLoop();
}