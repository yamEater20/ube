import {
	Vector,
    VectorRight,
    VectorZero
} from './engine/math.js';
import { PoolTypesFactory, POOL_TYPES, Registrar, CollidableProvider } from './pools.js';
import {Entity} from "./engine/entity.js";
import { debugOptions } from './engine/debug.js';
import { TILE_SIZE } from './engine/graphics.js';
import { entityDataToEntity } from './entities/parseEntityData.js';

export const ROOM_SIZE_TILES = Vector({x: 16, y: 16});

export class Room extends Entity {
	constructor(parent, relativePosition, levelData) {
		super(parent, relativePosition);

		//Control freak anti-pattern? Maybe, but very close to composition root.
		this._registrar = new Registrar(PoolTypesFactory());

		this.processLevelData(this._registrar, levelData);

		this._collidableProvider = new CollidableProvider(this.getPool(POOL_TYPES.COLLIDABLE));
	}

	processLevelData(registrar, levelData) {
		levelData = levelData.data;
		for (let y = 0; y < levelData.length; ++y) {
			for (let x = 0; x < levelData[y].length; ++x) {
				const entity = entityDataToEntity(this, levelData[y][x]);
				if (entity) registrar.registerEntity(entity);
			}
		}

		const roomSizeWorldSpace = ROOM_SIZE_TILES.scalar(TILE_SIZE);
		registrar.registerItem(POOL_TYPES.CAMERA_FOLLOW, new Entity(this, roomSizeWorldSpace.scalar(0.5)));
	}

	getPool(poolType) {return this._registrar.getPool(poolType);}

	draw(camera) {
		this.getPool(POOL_TYPES.DRAWABLE).foreach(item => item.draw(camera));
		if (debugOptions.showHitboxes) this.getPool(POOL_TYPES.DRAWABLE_DEBUG).foreach(item => item.draw(camera));
	}

	update(time) {
		if (!time.getPaused())
			this.getPool(POOL_TYPES.UPDATEABLE).foreach(item => item.update(time));
	}

	getLocalCollidableProvider() {
		return this._collidableProvider;
	}
}