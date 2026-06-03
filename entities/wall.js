import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CollisionHandlers from "../collisionHandlers.js";
import { POOL_TYPES } from "../pools.js";
import * as Sprites from "../engine/sprites.js";

export function makeWall(parent, relativePosition, entityData) {
	const hitbox = new RectHitbox(parent, relativePosition, 8, 8);

	const physObj = new PhysObj(
		hitbox,
		new DummyUpdateHandler(),
		new CollisionHandlers.TagOnly(
			[new CollisionHandlers.Wall(), new CollisionHandlers.Ground()]
		),
		new DummyCollidableProvider(),
	);

	let spriteSheet = entityData.outer ? Sprites.SPRITES.WALL_TILESHEET_OUTER : Sprites.SPRITES.WALL_TILESHEET;
	spriteSheet = entityData.isCorner ? Sprites.SPRITES.WALL_TILESHEET_CORNER : spriteSheet;

	const drawableEntity = new DrawableEntity(
		hitbox,
		new Sprites.TileSprite(spriteSheet, entityData.tileVec)
	);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [hitbox];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];

	return ret;
}