 import { TILE_SIZE } from "../engine/graphics.js";
import { Vector } from "../engine/math.js";
import { ENTITY_TYPE } from "../entities/parseEntityData.js";

//TODO: when you move to strongly typed, this should be a
//generic of type tile + return type.
//Ie class P extends ILDPP<T, R> {postProcess(T[] arr, T tile, x, y) returns R}
//That way you can configure the post processor to
export class ITileArrayPostProcessor {
    constructor() {
        this.postProcessTile = this.postProcessTile.bind(this);
    }
    
    postProcessTile(tileArr, tile, x, y) {
        throw new Error("Must implement");
    }
}

export class LevelDataPostProcessor {
    constructor(tileArrPostProcessors) {
        this._tileArrPostProcessors = tileArrPostProcessors;
    }

    execute(levelData) {
        this._tileArrPostProcessors.forEach(pp => {
            levelData.levels.forEach(level => {
                const tileArr = level.tileArray;
                forEach2D(tileArr, pp.postProcessTile);
            });
        });
        return levelData;
    }
}

function forEach2D(arr, func) {
    for (let y = 0; y < arr.length; ++y) {
        for (let x = 0; x < arr[y].length; ++x) {
            arr[y][x] = func(arr, arr[y][x], x, y);
        }
    }
}

export class GeneralPostProcess extends ITileArrayPostProcessor {
    constructor(hexParser) {
        super();
        this._hexParser = hexParser;
        this.postProcessTile = this.postProcessTile.bind(this);
    }

    postProcessTile(tileArr, hexCode, x, y) {
        const entityData = this._hexParser.hexToEntityData(hexCode);
        entityData.relativeX = x * TILE_SIZE;
        entityData.relativeY = y * TILE_SIZE;
        return entityData;
    }
}

export class EntityDataToEntityFactoryPostProcess extends ITileArrayPostProcessor {
    constructor(entityTypeToEntity) {
        super();
        this._entityTypeToEntity = entityTypeToEntity;
    }

    postProcessTile(tileArr, entityData, x, y) {
        let func;
        const entityType = entityData.entityType;

        let failure = false;
        let failureMessage = "";
        
        if (entityData.message) {
            failureMessage = entityData.message;
            failure = true;
        } else if (!(entityType in this._entityTypeToEntity)) {
            const entityTypeName = Object.keys(ENTITY_TYPE).find(k => ENTITY_TYPE[k] === entityType);
            failureMessage = `Cannot construct entity, missing factory. For entity type: ${entityType} (${entityTypeName})`;
            failure = true;
        }

        if (failure) {
            console.warn(failureMessage);
            func = this._entityTypeToEntity[ENTITY_TYPE.EMPTY];
        } else {
            func = this._entityTypeToEntity[entityData.entityType];
        }
        
        const relativePosition = Vector({x: entityData.relativeX, y: entityData.relativeY});
        return (parent) => func(parent, relativePosition, entityData);
    }
}