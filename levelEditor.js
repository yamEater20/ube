import {
    TILE_MAP_SIZE
} from "./world.js";
import { Vector } from "./math.js";

import { timeIt } from "./diagnostics.js";
import { TILE_SIZE } from "./graphics.js";

const TILES_IN_LEVEL = TILE_MAP_SIZE[0] * TILE_MAP_SIZE[1] + 3;

const CODES = {
    "#000000": "00",
    "#5F574F": "01",
    "#CB5082": "64",
    "#493826": "73",
    "#2C6829": "75",
    "#40F60D": "72",
    "#CC92C1": "20",
    "#E3B5DB": "21",
    "#F0D3EA": "22",
    "#FFE7FA": "23",
    "#E31C1C": "52",
    "#EC9233": "57",
    "#F6F260": "80",
    "#8953DF": "84",
    "#BE4AA8": "85",
    "#A53DB9": "86",
    "#676BE8": "61",
    "#3B3FDA": "62",
    "#83EBFF": "63",
    "#C1F5FF": "60",
    "#C1FFC8": "68",
    "#9FFFA9": "69",
    "#C9FFC4": "70",
    "#FFA76D": "80",
    "#621BB5": "81",
    "#6A23BA": "82",
    "#FFBD92": "80",
    "#652DBA": "83"
}

const LEVEL_PATH = "Levels.png";
const errs = [];

async function getImageData() {
    const img = await jimp.read(LEVEL_PATH);
    return img.bitmap;
}

async function getLevelData() {
    let data = await timeIt("Get image data", getImageData);

    const w = data.width;
    const h = data.height;
    data = data.data;
    const levels = chunkArray(data, w, h);
    let levelArr = [];
    for (let l = 0; l < levels.length; ++l) {
        const ldata = processLevel(levels[l]);
        levelArr = levelArr.concat(ldata);
    }
    const graph = createMapGraph(w / TILE_MAP_SIZE[0], h / TILE_MAP_SIZE[1]);
    errs.forEach(e => console.error(e));

    return {
        "levels": levelArr,
        "navigateMap": (curLevelInd, direction) => navigateMap(graph, curLevelInd, direction),
        "numLevels": levels.length,
        "worldLevelLocations": levels.map(
            l => Vector({
                x: l.x * TILE_MAP_SIZE[0] * TILE_SIZE,
                y: l.y * TILE_MAP_SIZE[1] * TILE_SIZE
            })
        )
    }
}

function toHex(x) {
    return x.toString(16).padStart(2, "0");
}

function chunkArray(arr, w, h) {
    const levels = [];
    for (let yl = 0; yl < h / TILE_MAP_SIZE[1]; ++yl) {
        for (let xl = 0; xl < w / TILE_MAP_SIZE[0]; ++xl) {
            // console.log(xl, yl);
            const level = {
                data: [],
                x: xl,
                y: yl
            }
            for (let y = 0; y < TILE_MAP_SIZE[1]; ++y) {
                const startInd = ((yl * TILE_MAP_SIZE[1] + y) * w + xl * TILE_MAP_SIZE[0]) * 4;
                const endInd   = ((yl * TILE_MAP_SIZE[1] + y) * w + xl * TILE_MAP_SIZE[0] + TILE_MAP_SIZE[0]) * 4;
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

    for (let y = 0; y < TILE_MAP_SIZE[1]; ++y) {
        let s = "\"";
        for (let x = 0; x < TILE_MAP_SIZE[0]; ++x) {
            let r = lData[y][x * 4];
            let g = lData[y][x * 4 + 1];
            let b = lData[y][x * 4 + 2];
            let a = lData[y][x * 4 + 3];
            let hex = "#" + toHex(r) + toHex(g) + toHex(b);
            hex = hex.toUpperCase();
            if (hex in CODES) {
                s += CODES[hex] + " ";
                ret.push(CODES[hex]);
            } else {
                errs.push(`ERROR: unkown ${hex} at Level [${lx}, ${ly}], coordinate (${x}, ${y})`);
                s += "ERROR";
            }
        }
        s += "\" +"
        // console.log(s);
    }
    ret.push(256);
    ret.push(lx + 280);
    ret.push(ly + 288);
    // console.log(`"256 ${lx + 280} ${ly + 288} " +`);

    return ret;
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

export {
    getLevelData,
	TILE_MAP_SIZE,
    TILES_IN_LEVEL
}