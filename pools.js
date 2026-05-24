import { AdjectiveIds } from "./collisionHandlers.js";
import { VectorDown, VectorZero } from "./math.js";

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

export class CollidablePool {
    constructor() {
        this.pool = [];
    }

    register(p) {
        this.pool.push(p);
    }

    getAllRiding(physObj) {
		return this.pool.filter(
			p =>
				p.isOverlap(physObj, VectorDown)
				&& p.collisionHandler.containsAdjective(AdjectiveIds.RIDABLE)
			);
	}

	getAllCollidingExcept(physObj, offset, except) {
        return this.pool.filter(p => physObj.isOverlap(p, offset));
    }
}

export class UpdateablePool {
    constructor() {
        this.pool = [];
    }

    register(p) {
        this.pool.push(p);
    }

    updateAll(time) {
        this.pool.forEach(c => c.update(time));
    }
}

export class ResettablePool {
	constructor() {
		this.pool = [];
	}

	register(p) {
        this.pool.push(p);
    }

    resetAll() {
        this.pool.forEach(c => c.reset());
    }
}

export class Registrar {
	constructor(collidablePool, drawablePool, updateablePool, resettablePool) {
		this._drawablePool = drawablePool;
		this._collidablePool = collidablePool;
		this._updateablePool = updateablePool;
		this._resettablePool = resettablePool;
	}

	registerDrawable(d) {
		this._drawablePool.register(d);
	}

	registerCollidable(c) {
		this._collidablePool.register(c);
	}

	registerUpdateable(u) {
		this._updateablePool.register(u);
	}

	registerResettable(r) {
		this._resettablePool.register(r);
	}
}

export class RegistrarDebug {
	constructor(collidablePool, drawablePool, updateablePool, resettablePool) {
		this._drawablePool = drawablePool;
		this._collidablePool = collidablePool;
		this._updateablePool = updateablePool;
		this._resettablePool = resettablePool;
	}

	registerDrawable(d) {
		this._drawablePool.register(d);
	}

	registerCollidable(c) {
		this._collidablePool.register(c);
		this.registerDrawable(c);
	}

	registerUpdateable(u) {
		this._updateablePool.register(u);
	}

	registerResettable(r) {
		this._resettablePool.register(r);
	}
}