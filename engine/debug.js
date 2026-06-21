export const BUILD_MODES = Object.freeze({
    LOCAL: 0,
    PRODUCTION: 1
});

// export const buildMode = BUILD_MODES.LOCAL;
export const buildMode = BUILD_MODES.PRODUCTION;

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