import { makeWall} from "./wall.js";
import { makeSemiSolid } from "./semisolid.js";
import { makeSpring } from "./spring.js";
import { Vector } from "../engine/math.js";
import { ENTITY_TYPE } from "../levelEditor/hexParsing.js";
import { makeSpike } from "./spike.js";

const a = {};
a[ENTITY_TYPE.EMPTY] = () => {};
a[ENTITY_TYPE.WALL] = makeWall;
a[ENTITY_TYPE.SEMISOLID] = makeSemiSolid;
a[ENTITY_TYPE.SPRING] = makeSpring;
a[ENTITY_TYPE.SPIKE] = makeSpike;

export function entityDataToEntity(parent, entityData) {
    const relativePosition = Vector({x: entityData.relativeX, y: entityData.relativeY});
    let func = a[entityData.entityType];
    if (!func) {
        console.warn("Unknown entity type: " + entityData.entityType);
        func = a[ENTITY_TYPE.EMPTY];
    }
    return func(parent, relativePosition, entityData);
}