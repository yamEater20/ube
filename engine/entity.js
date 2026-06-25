import { Vector, VectorZero } from "./math.js";

export class Entity {
    constructor(parent, relativePosition) {
        this.parent = parent;
        this.relativePosition = relativePosition ?? Vector({x: 0, y: 0});
    }
}

export function globalPosition(entity) {
    if (entity.parent == null) return VectorZero;
    return entity.relativePosition.addPoint(globalPosition(entity.parent));
}