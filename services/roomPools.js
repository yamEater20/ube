import { Registrar } from "../engine/pools.js";
import { CollidableProvider } from "./collidableProvider.js";
import { debugOptions } from "../engine/debug.js";
import { Pool } from "../engine/pools.js";
import { POOL_TYPES } from "../entities/poolTypes.js";

export class RegistrarWithRooms extends Registrar {
    constructor(registrar) {
        super();
        this._registrar = registrar;
    }

    setRoomsPool(r) {this._roomsPool = r;}
    getRoomsPool() {return this._roomsPool;}

    getPool(poolType) {
        return this._registrar.getPool(poolType).concat(this._roomsPool.getPool(poolType));
    }

    registerItem(poolType, object) {
        this._registrar.registerItem(poolType, object);
    }
}

export class GlobalCollidableProvider extends CollidableProvider {
    constructor(persistentCollidableProvider) {
        super();
        this._persistentCollidableProvider = persistentCollidableProvider;
    }

    setRoomsPool(r) {this._roomsPool = r;}
    getRoomsPool() {return this._roomsPool;}

    getAllRiding(physObj) {
        if (debugOptions.showAll) {
            return this._roomsPool.get().map(r => r.getLocalCollidableProvider().getAllColliding(physObj, offset)).reduce((a, b) => a.concat(b))
                .concat(this._persistentCollidableProvider.getAllColliding(physObj, offset));
        }
        
        return this
            ._roomsPool.getCurrentRoom().getLocalCollidableProvider().getAllRiding(physObj)
            .concat(this._persistentCollidableProvider.getAllRiding(physObj));
    }

    getAllColliding(physObj, offset) {
        if (debugOptions.showAll) {
            return this._roomsPool.get().map(r => r.getLocalCollidableProvider().getAllColliding(physObj, offset)).reduce((a, b) => a.concat(b))
                .concat(this._persistentCollidableProvider.getAllColliding(physObj, offset));
        }
        
        return this
            ._roomsPool.getCurrentRoom().getLocalCollidableProvider().getAllColliding(physObj, offset)
            .concat(this._persistentCollidableProvider.getAllColliding(physObj, offset))
    }
}

export class RoomsPool extends Pool {
	constructor(items) {
		super(items);
		this.roomIndex = 12;
	}

	getCurrentRoom() {
		return this.get()[this.roomIndex];
	}

	getPool(poolType) {
		// if (debugOptions.showAll && (poolType === POOL_TYPES.DRAWABLE || poolType === POOL_TYPES.DRAWABLE_DEBUG)) {
		// 	return this.get().map(r => r.getPool(poolType)).reduce((a, b) => a.concat(b));
		// }
		if ((poolType === POOL_TYPES.DRAWABLE || poolType === POOL_TYPES.DRAWABLE_DEBUG)) {
			return this.get().map(r => r.getPool(poolType)).reduce((a, b) => a.concat(b));
		}
		return this.getCurrentRoom().getPool(poolType);
		// return this.get().map(r => r.getPool(poolType)).reduce((a, b) => a.concat(b));
	}

	nextRoom() {
		this.roomIndex = (this.roomIndex + 1) % this._items.length;
	}
}