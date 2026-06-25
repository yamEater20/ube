export const BUILD_MODES = Object.freeze({
    LOCAL: 0,
    LOAD_TEST: 1,
    PRODUCTION: 2
});

// export const buildMode = BUILD_MODES.LOCAL;
export const buildMode = BUILD_MODES.LOAD_TEST;
// export const buildMode = BUILD_MODES.PRODUCTION;

export let debugOptions = {
    unlockDebug: buildMode === BUILD_MODES.LOCAL,
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