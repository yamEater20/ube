import { makeWall} from "./wall.js";
import { makeSemiSolid } from "./semisolid.js";
import { makeSpring } from "./spring.js";
import { makeSpike } from "./spike.js";
import { makeSpawn } from "./spawn.js";
import { Direction } from "../engine/math.js";

export const ENTITY_TYPE = Object.freeze({
    EMPTY: 0,
    WALL: 1,
    SEMISOLID: 2,
    SPRING: 3,
    SPIKE: 4,
    SPAWN: 5,
    GROUND_DECOR: 6
});

export const ENTITY_MAP = Object.freeze({
    "#000000": ENTITY_TYPE.EMPTY,
    "#5F574F": ENTITY_TYPE.WALL,
    "#493826": ENTITY_TYPE.SEMISOLID,
    "#E31C1C": ENTITY_TYPE.SPRING,
    "#CB5082": ENTITY_TYPE.SPAWN,
    "#9FFFA9": ENTITY_TYPE.GROUND_DECOR,
    "#CC92C1": {entityType: ENTITY_TYPE.SPIKE, direction: Direction.NORTH},
    "#E3B5DB": {entityType: ENTITY_TYPE.SPIKE, direction: Direction.WEST},
    "#F0D3EA": {entityType: ENTITY_TYPE.SPIKE, direction: Direction.SOUTH},
    "#FFE7FA": {entityType: ENTITY_TYPE.SPIKE, direction: Direction.EAST},
});

const entityTypeToEntity = {};
entityTypeToEntity[ENTITY_TYPE.EMPTY] = () => {};
entityTypeToEntity[ENTITY_TYPE.WALL] = makeWall;
entityTypeToEntity[ENTITY_TYPE.SEMISOLID] = makeSemiSolid;
entityTypeToEntity[ENTITY_TYPE.SPRING] = makeSpring;
entityTypeToEntity[ENTITY_TYPE.SPIKE] = makeSpike;
entityTypeToEntity[ENTITY_TYPE.SPAWN] = makeSpawn;

export const ENTITY_TYPE_TO_ENTITY = Object.freeze(entityTypeToEntity);