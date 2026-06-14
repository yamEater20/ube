import {
    ROOM_SIZE_TILES
} from "../entities/room.js";
import { Vector } from "../engine/math.js";

import { timeIt } from "../diagnostics.js";
import { TILE_SIZE } from "../engine/graphics.js";

//Invert dictionary
// const entityColorCodes = Object.fromEntries(
//     Object.entries(ENTITY_NAMES)
//         .map(arr => [arr[1], arr[0]])
// );

// const CODES = {
//     "#000000": "empty",
//     "#5F574F": "wall",
//     "#CB5082": "64",
//     "#493826": "73",
//     "#2C6829": "75",
//     "#40F60D": "72",
//     "#CC92C1": "20",
//     "#E3B5DB": "21",
//     "#F0D3EA": "22",
//     "#FFE7FA": "23",
//     "#E31C1C": "52",
//     "#EC9233": "57",
//     "#F6F260": "80",
//     "#8953DF": "84",
//     "#BE4AA8": "85",
//     "#A53DB9": "86",
//     "#676BE8": "61",
//     "#3B3FDA": "62",
//     "#83EBFF": "63",
//     "#C1F5FF": "60",
//     "#C1FFC8": "68",
//     "#9FFFA9": "69",
//     "#C9FFC4": "70",
//     "#FFA76D": "80",
//     "#621BB5": "81",
//     "#6A23BA": "82",
//     "#FFBD92": "80",
//     "#652DBA": "83"
// }

async function getImageData(levelPath) {
    const img = await jimp.read(levelPath);
    return img.bitmap;
}

async function getLevelData(levelPath, entityMap) {
    let data = await timeIt("Get image data", () => getImageData(levelPath));

    const w = data.width;
    const h = data.height;
    data = data.data;

    const levels = chunkArray(data, w, h).map(processLevel);
    const graph = createMapGraph(w / ROOM_SIZE_TILES.x, h / ROOM_SIZE_TILES.y);

    return {
        "levels": levels,
        "navigateMap": (curLevelInd, direction) => navigateMap(graph, curLevelInd, direction),
        "numLevels": levels.length,
        "worldLevelLocations": levels.map(
            l => Vector({
                x: l.x * ROOM_SIZE_TILES.x * TILE_SIZE,
                y: l.y * ROOM_SIZE_TILES.y * TILE_SIZE
            })
        )
    }
}

function toHex(x) {
    return x.toString(16).padStart(2, "0");
}

function chunkArray(arr, w, h) {
    const levels = [];
    for (let yl = 0; yl < h / ROOM_SIZE_TILES.y; ++yl) {
        for (let xl = 0; xl < w / ROOM_SIZE_TILES.x; ++xl) {
            const level = {
                data: [],
                x: xl,
                y: yl
            }
            for (let y = 0; y < ROOM_SIZE_TILES.y; ++y) {
                const startInd = ((yl * ROOM_SIZE_TILES.y + y) * w + xl * ROOM_SIZE_TILES.x) * 4;
                const endInd   = ((yl * ROOM_SIZE_TILES.y + y) * w + xl * ROOM_SIZE_TILES.x + ROOM_SIZE_TILES.x) * 4;
                level.data.push(arr.slice(startInd, endInd));
            }
            levels.push(level);
        }
    }
    return levels;
}

function processLevel(level) {
    const lData = level.data;
    const lx = level.x;
    const ly = level.y;

    const ret = [];

    for (let y = 0; y < ROOM_SIZE_TILES.y; ++y) {
        const row = [];
        for (let x = 0; x < ROOM_SIZE_TILES.x; ++x) {
            let r = lData[y][x * 4];
            let g = lData[y][x * 4 + 1];
            let b = lData[y][x * 4 + 2];
            let a = lData[y][x * 4 + 3];
            let hex = "#" + toHex(r) + toHex(g) + toHex(b);
            hex = hex.toUpperCase();
            row.push(hex);
        }
        ret.push(row);
    }

    return {
        tileArray: ret,
        x: lx,
        y: ly
    };
}

function createMapGraph(wl, hl) {
    const getLevelInd = (xl, yl) => {
        if (xl < 0 || xl >= wl) return -1;
        if (yl < 0 || yl >= hl) return -1;
        
        return yl * wl + xl;
    };

    const ret = {};

    for (let yl = 0; yl < hl; ++yl) {
        for (let xl = 0; xl < wl; ++xl) {
            const levelInd = getLevelInd(xl, yl);
            
            const n = getLevelInd(xl, yl-1);
            const s = getLevelInd(xl, yl+1);
            const e = getLevelInd(xl+1, yl);
            const w = getLevelInd(xl-1, yl);

            ret[levelInd] = [n, e, s, w];
        }
    }
    return ret;
}

function navigateMap(graph, curLevelInd, direction) {
    return graph[curLevelInd][direction];
}

function saveFile(levels) {
    var data = new Blob(JSON.stringify(levels), {type: 'application/json'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.

    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };

export {
    getLevelData,
}