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

export class PhysObjPool {
    constructor() {
        this.pool = [];
    }

    register(p) {
        this.pool.push(p);
    }

    updateAll(time) {
        this.pool.forEach(c => c.update(time));
    }

    getAllRiding(physObj) {return [];}

	getAllCollidingExcept(physObj, offset, except) {
        return this.pool.filter(p => physObj.isOverlap(p, offset));
    }
}