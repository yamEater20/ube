import { makeWall} from "./wall.js";
import { makeSemiSolid } from "./semisolid.js";
import { makeSpring } from "./spring.js";
import { makeSpike } from "./spike.js";
import { makeSpawn } from "./spawn.js";
import { Direction } from "../engine/math.js";
import { makeFrontLayerDecor } from "./frontLayerDecor.js";

import * as Sprites from "../engine/sprites.js";
import { makeTorch } from "./torch.js";

export const ENTITY_TYPES = Object.freeze({
    EMPTY: 0,
    WALL: 1,
    SEMISOLID: 2,
    SPRING: 3,
    SPIKE: 4,
    SPAWN: 5,
    BACK_LAYER_DECOR: 6,
    TORCH: 7
});

export const ENTITY_MAP = Object.freeze({
    "#000000": ENTITY_TYPES.EMPTY,
    "#5F574F": ENTITY_TYPES.WALL,
    "#493826": ENTITY_TYPES.SEMISOLID,
    "#E31C1C": ENTITY_TYPES.SPRING,
    "#CB5082": ENTITY_TYPES.SPAWN,
    
    "#3B3FDA": {entityType: ENTITY_TYPES.TORCH, offset: {x: 0, y: 0}},
    "#676BE8": {entityType: ENTITY_TYPES.TORCH, offset: {x: 4, y: 0}},

    "#9FFFA9": {entityType: ENTITY_TYPES.BACK_LAYER_DECOR, spriteArrayName: Sprites.SPRITE_ARRAY_NAMES.PLANT_IMGS },
    
    "#CC92C1": {entityType: ENTITY_TYPES.SPIKE, direction: Direction.NORTH},
    "#E3B5DB": {entityType: ENTITY_TYPES.SPIKE, direction: Direction.WEST},
    "#F0D3EA": {entityType: ENTITY_TYPES.SPIKE, direction: Direction.SOUTH},
    "#FFE7FA": {entityType: ENTITY_TYPES.SPIKE, direction: Direction.EAST},
});

const entityTypeToEntity = {};
entityTypeToEntity[ENTITY_TYPES.EMPTY] = () => {};
entityTypeToEntity[ENTITY_TYPES.WALL] = makeWall;
entityTypeToEntity[ENTITY_TYPES.SEMISOLID] = makeSemiSolid;
entityTypeToEntity[ENTITY_TYPES.SPRING] = makeSpring;
entityTypeToEntity[ENTITY_TYPES.SPIKE] = makeSpike;
entityTypeToEntity[ENTITY_TYPES.SPAWN] = makeSpawn;
entityTypeToEntity[ENTITY_TYPES.BACK_LAYER_DECOR] = makeFrontLayerDecor;
entityTypeToEntity[ENTITY_TYPES.TORCH] = makeTorch;

export const ENTITY_TYPE_TO_ENTITY = Object.freeze(entityTypeToEntity);