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

	concat(otherPool) {
		return new Pool(this.get().concat(otherPool.get()));
	}

	foreach(func) {this._items.forEach(item => func(item));}
}

export class CollidableProvider extends Pool {
	concat(otherPool) {
		return new CollidableProvider(this.get().concat(otherPool.get()));
	}

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

// TODO: can this be changed to a Dict<type, pool> ?
export const POOL_TYPES = Object.freeze({
	COLLIDABLE: 0,
	DRAWABLE: 1,
	UPDATEABLE: 2,
	RESETTABLE: 3,
	DRAWABLE_DEBUG: 4,
	ROOM: 5
});

//Pool of pools
export class Registrar {
	constructor(pools) {
		this._pools = pools;
	}

	getPool(poolType) {
		return this._pools[poolType];
	}

	registerItem(poolType, object) {
		this.getPool(poolType).register(object);
	}
}

export function PoolTypesFactory() {
	const poolDict = {};
	poolDict[POOL_TYPES.COLLIDABLE] = new CollidableProvider();
	poolDict[POOL_TYPES.DRAWABLE] = new Pool();
	poolDict[POOL_TYPES.UPDATEABLE] = new Pool();
	poolDict[POOL_TYPES.DRAWABLE_DEBUG] = new Pool();
	poolDict[POOL_TYPES.RESETTABLE] = new Pool();
	return poolDict;
}