import { ENTITY_TYPES } from "../entities/parseEntityData.js";
import {ITileArrayPostProcessor} from "../levelEditor/postProcess.js"
import { Vector, VectorZero, VectorRight } from "../engine/math.js";

export class SemiSolidPostProcess extends ITileArrayPostProcessor {
    postProcessTile(tileArr, entityData, x, y) {
        if (entityData.entityType === ENTITY_TYPES.SEMISOLID) {
            const wallLeft = x - 1 < 0                  || tileArr[y][x-1].entityType === ENTITY_TYPES.WALL;
            const wallRight =  x + 2 > tileArr[y].length    || tileArr[y][x+1].entityType === ENTITY_TYPES.WALL;

            if (wallLeft) entityData.tileVec = VectorZero;
            else if (wallRight) entityData.tileVec = VectorRight.scalar(2);
            else entityData.tileVec = VectorRight;
        }

        return entityData;
    }
}

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

export class WallMainPostProcess extends ITileArrayPostProcessor {
    postProcessTile(arr, entityData, x, y) {
        const entityType = entityData.entityType;
        if (entityType === ENTITY_TYPES.WALL) {
            let v = 0;
            let vecInds = Array(VEC_TILES.length).fill().map(() => v++);

            const isWallLeft    = x - 1 < 0             || entityIsWall(arr[y][x-1]);
            const isWallRight   = x + 2 > arr[y].length || entityIsWall(arr[y][x + 1]);
            const isWallTop     = y - 1 < 0             || entityIsWall(arr[y-1][x]);
            const isWallBottom  = y + 2 > arr.length    || entityIsWall(arr[y+1][x]);

            let col = -1;
            let row = -1;
            let isExtremity = false;
            if (isWallLeft && isWallRight) {
                col = 1;
            } else if (isWallLeft) {
                col = 2;
            } else if (isWallRight) {
                col = 0;
            } else {
                col = 1;
                isExtremity = true;
            }

            if (isWallTop && isWallBottom) {
                row = 1;
            } else if (isWallTop) {
                row = 2;
            } else if (isWallBottom) {
                row = 0;
            } else {
                row = 1;
                isExtremity = true;
            }
            
            vecInds = vecInds
                .filter(x => x % 3 === col)
                .filter(x => x >= row && x < (row + 1) * 3);

            let vecInd = vecInds[vecInds.length - 1];
            if (isExtremity && isWallLeft && isWallRight) vecInd = 0;
            else if (isExtremity && !isWallLeft && !isWallTop && !isWallRight && !isWallBottom) vecInd = 2;
            
            const vec = isExtremity ? VEC_TILES_OUTER[vecInd] : VEC_TILES[vecInd];
            
            entityData.tileVec = vec;
            entityData.outer = isExtremity;
            entityData.tileVecInd = vecInd;
        }

        return entityData;
    }
}

export class WallCornersPostProcess extends ITileArrayPostProcessor {
    postProcessTile(arr, entityData, x, y) {
        const entityType = entityData.entityType;
        if (entityType === ENTITY_TYPES.WALL && entityData.tileVecInd === 4) {
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

        return entityData;
    }
}

export class SpringCallbackPostProcess extends ITileArrayPostProcessor {
    constructor(onBounce) {
        super();
        this._onBounce = onBounce;
    }
    
    postProcessTile(arr, entityData, x, y) {
        if (entityData.entityType === ENTITY_TYPES.SPRING) {
            entityData.onBounce = this._onBounce;
        }
        return entityData;
    }
}

function entityIsWall(entityData) {
    return entityData.entityType === ENTITY_TYPES.WALL;
}