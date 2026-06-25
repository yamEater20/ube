export const BUILD_MODES = Object.freeze({
    LOCAL: 0,
    LOAD_TEST: 1,
    PRODUCTION: 2
});

export let debugOptions = {
    noClip: false,
    showHitboxes: false,
    showAll: false,
}

let debug = false;

export function toggleDebugAll() {
    debug = !debug;
    Object.keys(debugOptions).forEach(key => {
        debugOptions[key] = debug;
      });
}