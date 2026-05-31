import { TAG_IDS } from "./collisionHandlers.js";
import { VectorDown } from "./engine/math.js";

export class Pool {
    constructor(items) {
        this._items = items ?? [];
    }

    register(d) {
        this._items.push(d);
    }

	concat(otherPool) {
		return new Pool(this.get().concat(otherPool.get()));
	}

    get() {return this._items}

	foreach(func) {this._items.forEach((item, index) => func(item, index));}
}

export class CollidableProvider {
	constructor (pool) {
		this._pool = pool;
	}

    getAllRiding(physObj) {
		return this._pool.get().filter(
			p =>
				p != physObj &&
				p.isOverlap(physObj, VectorDown) &&
				p.collisionHandler.containsTag(TAG_IDS.RIDABLE)
			);
	}

	getAllColliding(physObj, offset) {
        return this._pool.get().filter(p => physObj.isOverlap(p, offset));
    }

	concat(otherPool) {
		return new CollidableProvider(this.get().concat(otherPool.get()));
	}
}

// TODO: can this be changed to a Dict<type, pool>
export const POOL_TYPES = Object.freeze({
	COLLIDABLE: 0,
	DRAWABLE: 1,
	UPDATEABLE: 2,
	RESETTABLE: 3,
	DRAWABLE_DEBUG: 4,
	ROOM: 5,
	CAMERA_FOLLOW: 6
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

	registerEntity(dict) {
		Object.keys(dict).forEach(
			poolType => dict[poolType].forEach(item => this.getPool(poolType).register(item))
		)
	}
}

export function PoolTypesFactory() {
	const poolDict = {};
	poolDict[POOL_TYPES.COLLIDABLE] = new Pool();
	poolDict[POOL_TYPES.DRAWABLE] = new Pool();
	poolDict[POOL_TYPES.UPDATEABLE] = new Pool();
	poolDict[POOL_TYPES.DRAWABLE_DEBUG] = new Pool();
	poolDict[POOL_TYPES.RESETTABLE] = new Pool();
	poolDict[POOL_TYPES.CAMERA_FOLLOW] = new Pool();
	return poolDict;
}