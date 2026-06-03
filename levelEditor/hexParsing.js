import { Direction } from "../engine/math.js";

export const ENTITY_TYPE = Object.freeze({
    EMPTY: 0,
    WALL: 1,
    SEMISOLID: 2,
    SPRING: 3,
    SPIKE: 4
});

const ENTITY_MAP = Object.freeze({
    "#000000": ENTITY_TYPE.EMPTY,
    "#5F574F": ENTITY_TYPE.WALL,
    "#493826": ENTITY_TYPE.SEMISOLID,
    "#E31C1C": ENTITY_TYPE.SPRING,
    "#CC92C1": {entityType: ENTITY_TYPE.SPIKE, direction: Direction.SOUTH},
    // "#CC92C1": spike("sdsd"),
    // "#CC92C1": spike("sdsd"),
    // "#CC92C1": spike("sdsd"),
});

export function hexToEntityData(hex) {
    const mappedData = ENTITY_MAP[hex];
    if (typeof mappedData === "object") return structuredClone(mappedData);
    else if (typeof mappedData === "number") return {entityType: mappedData};
    else return {entityType: ENTITY_TYPE.EMPTY, message: "Unknown hex code: " + hex};
}