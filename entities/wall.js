import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler, HitboxDrawableEntity } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CustomCollisionHandlers from "../services/entityCollisionHandlers.js";
import { POOL_TYPES } from "./poolTypes.js";
import * as Sprites from "../engine/sprites.js";
import { VectorZero } from "../engine/math.js";
import { Tags } from "../services/customCollisionHandlers.js";

export function makeWall(parent, relativePosition, entityData) {
	const hitbox = new RectHitbox(VectorZero, 8, 8);
	const physObj = new PhysObj(
		parent,
		relativePosition,
		hitbox,
		new DummyUpdateHandler(),
		new Tags(
			[new CustomCollisionHandlers.Wall(), new CustomCollisionHandlers.Ground()]
		),
		new DummyCollidableProvider(),
	);

	let spriteSheet = entityData.outer ? Sprites.SPRITE_LK.WALL_TILESHEET_OUTER : Sprites.SPRITE_LK.WALL_TILESHEET;
	spriteSheet = entityData.isCorner ? Sprites.SPRITE_LK.WALL_TILESHEET_CORNER : spriteSheet;

	const drawableEntity = new DrawableEntity(
		physObj,
		new Sprites.TileSprite(spriteSheet, entityData.tileVec)
	);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox)];
	ret[POOL_TYPES.DRAWABLE] = [{item: drawableEntity, layer: 5}];

	return ret;
}