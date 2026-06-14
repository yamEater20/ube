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