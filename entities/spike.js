import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler, HitboxDrawableEntity } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CollisionHandlers from "../collisionHandlers.js";
import { POOL_TYPES } from "../pools.js";
import * as Sprites from "../engine/sprites.js";
import { Direction, directionToRad, Vector, VectorZero } from "../engine/math.js";
import { TILE_SIZE } from "../engine/graphics.js";

export function makeSpike(parent, relativePosition, entityData) {
	let hitbox = getSpikeHitbox(entityData.direction);

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
		new Sprites.RotatedSprite(Sprites.SPRITE_LK.SPIKES_IMG, directionToRad(entityData.direction))
	);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox)];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];

	return ret;
}

function getSpikeHitbox(direction) {
	switch (direction) {
		case Direction.WEST: return new RectHitbox(Vector({x: 0, y: 0}), 2, TILE_SIZE);
		case Direction.NORTH: return new RectHitbox(Vector({x: 0, y: 6}), TILE_SIZE, 2);
		case Direction.EAST: return new RectHitbox(Vector({x: 6, y: 0}), 2, TILE_SIZE);
		case Direction.SOUTH: return new RectHitbox(Vector({x: 0, y: 0}), TILE_SIZE, 2);
	}
}