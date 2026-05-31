import { ENTITY_NAMES } from "./entityCodes.js";
import { Vector, VectorRight, VectorZero } from "../engine/math.js";

const VEC_TILES = Object.freeze([
	Vector({x: 0, y: 0}),
	Vector({x: 1, y: 0}),
	Vector({x: 2, y: 0}),
	Vector({x: 0, y: 1}),
	Vector({x: 1, y: 1}),
	Vector({x: 2, y: 1}),
	Vector({x: 0, y: 2}),
	Vector({x: 1, y: 2}),
	Vector({x: 2, y: 2}),
]);

const VEC_TILES_OUTER = Object.freeze([
	Vector({x: 0, y: 0}),
	Vector({x: 1, y: 0}),
	Vector({x: 2, y: 0}),
	Vector({x: 0, y: 1}),
	Vector({x: 1, y: 1}),
	Vector({x: 2, y: 1}),
	null,
	Vector({x: 1, y: 2}),
	null
]);

const VEC_TILES_CORNER = Object.freeze([
	Vector({x: 0, y: 0}),
	Vector({x: 1, y: 0}),
	Vector({x: 0, y: 1}),
	Vector({x: 1, y: 1}),
    Vector({x: 2, y: 2}),
]);

function postProcessArr(data, func) {
    for (let y = 0; y < data.length; ++y) {
        for (let x = 0; x < data[y].length; ++x) {
            func(data, data[y][x], x, y);
        }
    }
}

export function postProcessSemisolids(levelData) {
    postProcessArr(levelData.data, (arr, entityData, x, y) => {
        if (entityData.entityType === ENTITY_NAMES.SEMISOLID) {
            const wallLeft = x - 1 < 0                  || arr[y][x-1].entityType === ENTITY_NAMES.WALL;
            const wallRight =  x + 2 > arr[y].length    || arr[y][x+1].entityType === ENTITY_NAMES.WALL;

            if (wallLeft) entityData.tileVec = VectorZero;
            else if (wallRight) entityData.tileVec = VectorRight.scalar(2);
            else entityData.tileVec = VectorRight;
        }
    });

    return levelData;
}

export function postProcessWalls(levelData) {
    const data = levelData.data;

    postProcessArr(data,
        (arr, entityData, x, y) => {
            const entityType = entityData.entityType;
            if (entityType === ENTITY_NAMES.WALL) {
                let v = 0;
                let vecInds = Array(VEC_TILES.length).fill().map(() => v++);

                const isWallLeft    = x - 1 < 0             || entityIsWall(arr[y][x-1]);
				const isWallRight   = x + 2 > arr[y].length || entityIsWall(arr[y][x + 1]);
				const isWallTop     = y - 1 < 0             || entityIsWall(arr[y-1][x]);
				const isWallBottom  = y + 2 > arr.length    || entityIsWall(arr[y+1][x]);

                let col = -1;
				let row = -1;
				let outer = false; //todo: rename to isExtremity
				if (isWallLeft && isWallRight) {
					col = 1;
				} else if (isWallLeft) {
					col = 2;
				} else if (isWallRight) {
					col = 0;
				} else {
					col = 1;
					outer = true;
				}

                if (isWallTop && isWallBottom) {
					row = 1;
				} else if (isWallTop) {
					row = 2;
				} else if (isWallBottom) {
					row = 0;
				} else {
					row = 1;
					outer = true;
				}
                
                vecInds = vecInds
                    .filter(x => x % 3 === col)
                    .filter(x => x >= row && x < (row + 1) * 3);

                let vecInd = vecInds[vecInds.length - 1];
                if (outer && isWallLeft && isWallRight) vecInd = 0;
                else if (outer && !isWallLeft && !isWallTop && !isWallRight && !isWallBottom) vecInd = 2;
                
                const vec = outer ? VEC_TILES_OUTER[vecInd] : VEC_TILES[vecInd];
                
                entityData.tileVec = vec;
                entityData.outer = outer;
                entityData.tileVecInd = vecInd;
            }
        }
    );

    postProcessArr(data,
        (arr, entityData, x, y) => {
            const entityType = entityData.entityType;
            if (entityType === ENTITY_NAMES.WALL && entityData.tileVecInd === 4) {
                const left      = x - 1 < 0              || arr[y][x-1].isCorner ? -1 : arr[y][x-1].tileVecInd;
                const right     = x + 2 > arr[y].length  || arr[y][x+1].isCorner ? -1 : arr[y][x+1].tileVecInd;
                const top       = y - 1 < 0              || arr[y-1][x].isCorner ? -1 : arr[y-1][x].tileVecInd;
                const bottom    = y + 2 > arr[y].length  || arr[y+1][x].isCorner ? -1 : arr[y+1][x].tileVecInd;
                let isCorner = true;
                let tileVecInd = 0;

        		if ((top === 5 || top === 2) && (right === 1 || right === 2))               tileVecInd = 1;
                else if ((top === 3 || top === 0) && (left === 1 || left === 0))            tileVecInd = 0;
                else if ((bottom === 3 || bottom === 6) && (left === 7 || left === 6))      tileVecInd = 2;
                else if ((bottom === 5 || bottom === 8) && (right === 7 || right === 8))    tileVecInd = 3;
                else isCorner = false;

                entityData.isCorner = isCorner;
                if (isCorner) {
                    entityData.tileVecInd = tileVecInd;
                    entityData.tileVec = VEC_TILES_CORNER[tileVecInd];
                }
            }
        }
    );

    return levelData;
}

function entityIsWall(entityData) {
    return entityData.entityType === ENTITY_NAMES.WALL;
}

function convertWallTiles(arr) {
	let curInd = 0;
	const xyToTileInd = (x, y) => y * TILE_MAP_SIZE[0] + x;
	for (let y = 0; y < TILE_MAP_SIZE[1]; y++) {
		for (let x = 0; x < TILE_MAP_SIZE[0]; x++) {
			let v = 0;
            const codeIsConnector = tileCode === 1 ? codeIsWall : codeIsIce;
            //List of indices of possible tiles
            let vecInds = Array(VEC_TILES.length).fill().map(() => v++);
            

            const isWallLeft = codeIsConnector(x - 1 < 0 ? tileCode : parseInt(arr[xyToTileInd(x - 1, y)]));
            const isWallRight = codeIsConnector(x + 2 > TILE_MAP_SIZE[0] ? tileCode : parseInt(arr[xyToTileInd(x + 1, y)]));
            const isWallTop = codeIsConnector(y - 1 < 0 ? tileCode : parseInt(arr[xyToTileInd(x, y - 1)]));
            const isWallBottom = codeIsConnector(y + 2 > TILE_MAP_SIZE[1] ? tileCode : parseInt(arr[xyToTileInd(x, y + 1)]));

            let col = -1;
            let row = -1;
            let outer = false;
            if (isWallLeft && isWallRight) {
                col = 1;
            } else if (isWallLeft) {
                col = 2;
            } else if (isWallRight) {
                col = 0;
            } else {
                col = 1;
                outer = true;
            }

            vecInds = filterVec(x => x % 3 === col);

            if (isWallTop && isWallBottom) {
                row = 1;
            } else if (isWallTop) {
                row = 2;
            } else if (isWallBottom) {
                row = 0;
            } else {
                row = 1;
                outer = true;
            }
            vecInds = filterVec(x => x >= row && x < (row + 1) * 3);
            let last = -100;
            if (outer && isWallLeft && isWallRight) {
                last = 9 + tileCode
            } else if (outer && !isWallLeft && !isWallTop && !isWallRight && !isWallBottom) {
                last = 11 + tileCode;
            } else {
                last = vecInds[vecInds.length - 1] + (outer ? 9 : 0) + tileCode;
            }

            arr[curInd] = last;
		}
	}
}