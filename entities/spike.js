import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CollisionHandlers from "../collisionHandlers.js";
import { POOL_TYPES } from "../pools.js";
import * as Sprites from "../engine/sprites.js";
import { directionToVector } from "../engine/math.js";

export function makeSpike(parent, relativePosition, entityData) {
	const hitbox = new RectHitbox(parent, relativePosition, 8, 8);

	const physObj = new PhysObj(
		hitbox,
		new DummyUpdateHandler(),
		new CollisionHandlers.TagOnly(
			[new CollisionHandlers.Wall(), new CollisionHandlers.Ground()]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(
		hitbox,
		new Sprites.Sprite(Sprites.SPRITES.SPIKES_IMG, directionToVector(entityData.direction))
	);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [hitbox];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];

	return ret;
}