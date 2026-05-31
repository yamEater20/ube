export let debugOptions = {
    debug: false,
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