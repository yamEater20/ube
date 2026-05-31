import {
	Vector,
    VectorRight,
    VectorZero
} from './engine/math.js';
import * as Sprites from "./engine/sprites.js";
import { PoolTypesFactory, POOL_TYPES, Registrar, CollidableProvider } from './pools.js';
import { makeWall } from './entities/wall.js';
import {Entity} from "./engine/entity.js";
import { debugOptions } from './engine/debug.js';
import {ENTITY_NAMES} from "./levelEditor/entityCodes.js";
import { TILE_SIZE } from './engine/graphics.js';
import { makeSemiSolid } from './entities/semisolid.js';

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
				const entityData = levelData[y][x];
				const entityType = entityData.entityType;
				const relativePosition = Vector({x: entityData.relativeX, y: entityData.relativeY});
				
				if (entityType === ENTITY_NAMES.EMPTY) {

				} else if(entityType === ENTITY_NAMES.WALL) {
					let spriteSheet = entityData.outer ? Sprites.SPRITES.WALL_TILESHEET_OUTER : Sprites.SPRITES.WALL_TILESHEET;
					spriteSheet = entityData.isCorner ? Sprites.SPRITES.WALL_TILESHEET_CORNER : spriteSheet;
					registrar.registerEntity(
						makeWall(
							this,
							relativePosition,
							new Sprites.TileSprite(spriteSheet, entityData.tileVec)
						)
					);
				} else if (entityType === ENTITY_NAMES.SEMISOLID) {
					registrar.registerEntity(
						makeSemiSolid(
							this,
							relativePosition,
							new Sprites.TileSprite(Sprites.SPRITES.SEMISOLID_TILESHEET, entityData.tileVec)
						)
					);
				}
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