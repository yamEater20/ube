import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler, HitboxDrawableEntity } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CustomCollisionHandlers from "./entityCollisionHandlers.js";
import { POOL_TYPES } from "./poolTypes.js";
import * as Sprites from "../engine/sprites.js";
import { VectorZero } from "../engine/math.js";
import { TagOnly } from "../services/customCollisionHandlers.js";

class SemisolidCollisionTag extends CustomCollisionHandlers.Ground {
	isGround(movingPhysObj, tagPhysObj, direction) {
		const above = movingPhysObj.isOnTopOf(tagPhysObj);
		return direction.y > 0 && above;
    }
	
	shouldStopMoving(tagPhysObj, movingPhysObj, direction) {
		return this.isGround(movingPhysObj, tagPhysObj, direction);
    }
}

export function makeSemiSolid(parent, relativePosition, entityData) {
	const hitbox = new RectHitbox(VectorZero, 8, 2);
	const physObj = new PhysObj(
		parent,
		relativePosition,
		hitbox,
		new DummyUpdateHandler(),
		new TagOnly(
			[new SemisolidCollisionTag()]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(
		physObj,
		new Sprites.TileSprite(Sprites.SPRITE_LK.SEMISOLID_TILESHEET, entityData.tileVec)
	);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox)];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];

	return ret;
}