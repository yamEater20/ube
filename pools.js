import { AdjectiveIds } from "./collisionHandlers.js";
import { VectorDown, VectorZero } from "./engine/math.js";

export class Pool {
    constructor() {
        this._items = [];
    }

    register(d) {
        this._items.push(d);
    }

    get() {return this._items}

	foreach(func) {this._items.forEach(item => func(item));}
}

export class CollidableProvider extends Pool {
    getAllRiding(physObj) {
		return this.get().filter(
			p =>
				p != physObj
				&& p.isOverlap(physObj, VectorDown)
				&& p.collisionHandler.containsAdjective(AdjectiveIds.RIDABLE)
			);
	}

	getAllCollidingExcept(physObj, offset, except) {
        return this.get().filter(p => physObj.isOverlap(p, offset) && !except.includes(p));
    }
}

export class Registrar {
	constructor(collidablePool, drawablePool, updateablePool, resettablePool, debugDrawablePool) {
		this._drawablePool = drawablePool;
		this._collidablePool = collidablePool;
		this._updateablePool = updateablePool;
		this._resettablePool = resettablePool;
		this._debugDrawablePool = debugDrawablePool;
	}

	registerDrawable(d) {
		this._drawablePool.register(d);
	}

	registerCollidable(c) {
		this._collidablePool.register(c);
		this._debugDrawablePool.register(c);
	}

	registerUpdateable(u) {
		this._updateablePool.register(u);
	}

	registerResettable(r) {
		this._resettablePool.register(r);
	}
}