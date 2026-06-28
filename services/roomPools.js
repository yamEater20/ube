import { Registrar } from "../engine/pools.js";
import { CollidableProvider } from "./collidableProvider.js";
import { debugOptions } from "../engine/debug.js";
import { Pool } from "../engine/pools.js";
import { POOL_TYPES } from "../entities/poolTypes.js";

export class RegistrarWithRooms extends Registrar {
    constructor(registrar, roomsPool) {
        super();
        this._registrar = registrar;
        this._roomsPool = roomsPool;
    }

    getPool(poolType) {
        return this._registrar.getPool(poolType).concat(this._roomsPool.getPool(poolType));
    }

    registerItem(poolType, object) {
        this._registrar.registerItem(poolType, object);
    }
}

export class CollidableProviderWithRooms extends CollidableProvider {
    constructor(persistentCollidableProvider, roomsPool) {
        super();
        this._persistentCollidableProvider = persistentCollidableProvider;
        this._roomsPool = roomsPool;
    }

    getAllRiding(physObj) {
        if (debugOptions.showAll) {
            return this._roomsPool.get().map(r => r.getLocalCollidableProvider().getAllRiding(physObj)).reduce((a, b) => a.concat(b))
                .concat(this._persistentCollidableProvider.getAllRiding(physObj));
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

export class RoomIndicesProvider {
    constructor(initialRoomIndex) {
        this._mapGraph = {};
        this.isCameraShaking;
        this.isCameraMoving;

        this._roomIndex = initialRoomIndex;
        this._lastRoomIndex = initialRoomIndex;
    }

    setMapGraph(mapGraph) {
        this._mapGraph = mapGraph;
    }

    newRoomIndex(roomIndex) {
        this._lastRoomIndex = this._roomIndex;
        this._roomIndex = roomIndex;
    }

    getIndices(roomInd) {
        let ret = [roomInd];
        
        const isShaking = this.isCameraShaking();
        if (isShaking) {
            const potentialIndices = this._mapGraph[roomInd];
            ret = ret.concat(
                Object.values(potentialIndices)
                    .filter(ind => ind !== -1)
                    .concat([roomInd])
            );
        }

        if (this.isCameraMoving()) {
            ret = ret.concat(this._lastRoomIndex);

            if (isShaking) {
                const potentialIndices = this._mapGraph[this._lastRoomIndex];
                ret = ret.concat(
                    Object.values(potentialIndices)
                        .filter(ind => ind !== -1)
                        .concat([roomInd])
                );
            }
        }

        return [...new Set(ret)];
    }
}

export class RoomsPool extends Pool {
	constructor(drawableRoomIndicesProvider, initialRoomIndex) {
		super();
        this._drawableRoomIndicesProvider = drawableRoomIndicesProvider;
		this._roomIndex = initialRoomIndex ?? 0;
	}

    setRooms(rooms) {
        this._items = rooms;
    }

    setRoomIndex(roomIndex) {
        this._roomIndex = roomIndex;
    }

	getCurrentRoom() {
		return this.get()[this._roomIndex];
	}

	getPool(poolType) {
		// if (poolType === POOL_TYPES.DRAWABLE || poolType === POOL_TYPES.DRAWABLE_DEBUG) {
		// 	return this.get().map(r => r.getPool(poolType)).reduce((a, b) => a.concat(b));
		// }
		if ((poolType === POOL_TYPES.DRAWABLE || poolType === POOL_TYPES.DRAWABLE_DEBUG)) {
            const roomIndices = this._drawableRoomIndicesProvider.getIndices(this._roomIndex);
            return roomIndices
                .map(roomInd => this.get()[roomInd].getPool(poolType))
                // .map(p => {console.log(p); return p;})
                .reduce((a, b) => a.concat(b));
            // if (this._roomIndex === this._lastRoomIndex) return this.getCurrentRoom().getPool(poolType);
            //     return this.getCurrentRoom().getPool(poolType).concat(this.get()[this._lastRoomIndex].getPool(poolType));
		}

		return this.getCurrentRoom().getPool(poolType);
	}

	nextRoom() {
		this._roomIndex = (this._roomIndex + 1) % this._items.length;
	}
}