import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler, HitboxDrawableEntity } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CollisionHandlers from "../collisionHandlers.js";
import { POOL_TYPES } from "../pools.js";
import * as Sprites from "../engine/sprites.js";
import { directionToVector, Vector, VectorZero } from "../engine/math.js";

export function makeSpike(parent, relativePosition, entityData) {
	const hitbox = new RectHitbox(Vector({x: 0, y: 6}), 8, 2);

	const physObj = new PhysObj(
		parent,
		relativePosition,
		hitbox,
		new DummyUpdateHandler(),
		new CollisionHandlers.TagOnly(
			[new CollisionHandlers.Spike(entityData.direction)]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(
		physObj,
		new Sprites.Sprite(Sprites.SPRITES.SPIKES_IMG, directionToVector(entityData.direction))
	);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox)];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];

	return ret;
}