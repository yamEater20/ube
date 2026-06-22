import { LayeredPool, Pool } from "../engine/pools.js";

// TODO: can this be changed to a Dict<type, pool>
export const POOL_TYPES = Object.freeze({
	COLLIDABLE: 0,
	DRAWABLE: 1,
	UPDATEABLE: 2,
	RESETTABLE: 3,
	DRAWABLE_DEBUG: 4,
	ROOM: 5,
	CAMERA_FOLLOW: 6,
	SPAWN: 7
});

export function PoolTypesFactory() {
	const poolDict = {};
	poolDict[POOL_TYPES.COLLIDABLE] = new Pool();
	poolDict[POOL_TYPES.DRAWABLE] = new LayeredPool();
	poolDict[POOL_TYPES.UPDATEABLE] = new Pool();
	poolDict[POOL_TYPES.DRAWABLE_DEBUG] = new Pool();
	poolDict[POOL_TYPES.RESETTABLE] = new Pool();
	poolDict[POOL_TYPES.CAMERA_FOLLOW] = new Pool();
	return poolDict;
}