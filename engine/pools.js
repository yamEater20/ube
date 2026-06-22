export class IPool {
	constructor() {}
	register(d) {throw new Error("Must implement");}
	concat(otherPool) {throw new Error("Must implement");}
	get() {throw new Error("Must implement");}
	foreach() {throw new Error("Must implement");}
}

export class Pool extends IPool {
    constructor(items) {
		super();
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

//TODO: JEEZ dude. I think this needs a refactor.
export class LayeredPool extends IPool {
	constructor(items) {
		super();
		this._items = items ?? {};

		this._sortedKeys = Object.keys(this._items).map(layer => this._items[layer].layer).sort((a, b) => a - b);
    }

    register(args) {
		const item = args.item;
		const layer = args.layer;
		
		if (item == undefined) throw new Error("Wrong input type");
		
		if (!this._items[layer]) {
			this._items[layer] = {layer: layer, items: []};
			this._sortedKeys.push(layer);
			this._sortedKeys = this._sortedKeys.sort((a, b) => a - b);
		}

        this._items[layer].items.push(item);
    }

	//TODO: maybe I need to rethink my definition of IPool.
	concat(otherPool) {
		const retItems = {};
		this._sortedKeys.forEach(layer => {
			retItems[layer] = {layer: layer, items: this._items[layer].items};
		});

		const otherItems = otherPool.get();
		Object.keys(otherItems).forEach(layer => {
			const retCurLayer = retItems[layer];
			if (retCurLayer) retItems[layer].items = retCurLayer.items.concat(otherItems[layer].items);
			else retItems[layer] = {layer: layer, items: otherItems[layer].items};
		});
		return new LayeredPool(retItems);
	}

    get() {return this._items;}

	foreach(func) {
		const items = this.get();
		this._sortedKeys.forEach(layer => items[layer].items.forEach(func));
	}
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