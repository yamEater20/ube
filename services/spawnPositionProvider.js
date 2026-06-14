import { POOL_TYPES } from "../entities/poolTypes.js";

export class SpawnPositionProvider {
    constructor(roomsPool) {
        this._roomsPool = roomsPool;
    }

    getSpawnPosition() 3{
        return this._roomsPool.getPool(POOL_TYPES.SPAWN).get()[0].globalPosition();
    }
}