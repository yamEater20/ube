import { Vector } from "./math.js";

export class Entity {
    constructor(parent, relativePosition) {
        this.relativePosition = relativePosition ?? Vector({x: 0, y: 0});
        this.parent = parent;
    }

    globalPosition() {
        return this.relativePosition.addPoint(this.parent.globalPosition());
    }
}