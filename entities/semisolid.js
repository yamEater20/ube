import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CollisionHandlers from "../collisionHandlers.js";
import { POOL_TYPES } from "../pools.js";

class SemisolidCollisionTag extends CollisionHandlers.Ground {
    isGround(otherPhysObj, semisolidPhysObj, direction) {
        return otherPhysObj.isOnTopOf(semisolidPhysObj);
    }
}

export function makeSemiSolid(parent, relativePosition, sprite) {
	const hitbox = new RectHitbox(parent, relativePosition, 8, 2);
	const physObj = new PhysObj(
		hitbox,
		new DummyUpdateHandler(),
		new CollisionHandlers.TagOnly(
			[new SemisolidCollisionTag()]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(hitbox, sprite);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [hitbox];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];

	return ret;
}