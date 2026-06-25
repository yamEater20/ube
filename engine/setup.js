export function beginGameLoop(loop) {
    loop();
    window.requestAnimationFrame(() => beginGameLoop(loop));
}