import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CollisionHandlers from "../collisionHandlers.js";
import { POOL_TYPES } from "../pools.js";

//Control freak? No, this is a composition root function.
export function makeWall(parent, relativePosition, sprite) {
	const hitbox = new RectHitbox(parent, relativePosition, 8, 8);

	const physObj = new PhysObj(
		hitbox,
		new DummyUpdateHandler(),
		new CollisionHandlers.AdjectiveOnly(
			[new CollisionHandlers.Wall(), new CollisionHandlers.Ground()]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(hitbox, sprite);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [physObj];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];
	return ret;
}