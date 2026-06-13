import { Entity } from "../engine/entity.js";
import { POOL_TYPES } from "../pools.js";

export function makeSpawn(parent, relativePosition, entityData) {
    const ret = {};
    ret[POOL_TYPES.SPAWN] = [new Entity(parent, relativePosition.addPoint({x: 0, y: 2}))];
    return ret;
}