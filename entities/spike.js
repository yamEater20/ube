import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler, HitboxDrawableEntity } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CustomCollisionHandlers from "../services/entityCollisionHandlers.js";
import { POOL_TYPES } from "./poolTypes.js";
import * as Sprites from "../engine/sprites.js";
import { Direction, directionToRad as directionToRadians, Vector, VectorZero } from "../engine/math.js";
import { TILE_SIZE } from "../engine/graphics.js";
import { Tags } from "../services/customCollisionHandlers.js";

export function makeSpike(parent, relativePosition, entityData) {
	let hitbox = getSpikeHitbox(entityData.direction);

	const physObj = new PhysObj(
		parent,
		relativePosition,
		hitbox,
		new DummyUpdateHandler(),
		new Tags(
			[new CustomCollisionHandlers.Spike(entityData.direction)]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(
		physObj,
		new Sprites.RotatedSprite(
			Sprites.SPRITE_LK.SPIKES_IMG,
			directionToRadians(entityData.direction),
			Vector({x: 4, y: 4})
		)
	);
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox)];
	ret[POOL_TYPES.DRAWABLE] = [{item: drawableEntity, layer: 5}];

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