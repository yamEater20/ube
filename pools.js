import { VectorZero } from "./math.js";

export class DrawablePool {
    constructor() {
        this.drawables = [];
    }

    register(d) {
        this.drawables.push(d);
    }

    drawAll(camera) {
        this.drawables.forEach(d => d.draw(camera));
    }
}