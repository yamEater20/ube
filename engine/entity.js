import { Vector } from "./math.js";

export class Entity {
    constructor(parent, relativePosition) {
        this.parent = parent;
        this.relativePosition = relativePosition ?? Vector({x: 0, y: 0});
    }

    globalPosition() {
        if (!this.parent.globalPosition) console.log(this);
        return this.relativePosition.addPoint(this.parent.globalPosition());
    }
}