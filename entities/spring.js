import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as CollisionHandlers from "../collisionHandlers.js";
import { POOL_TYPES } from "../pools.js";
import { AnimatedSprite, SPRITES } from "../engine/sprites.js";
import { Vector } from "../engine/math.js";

export function makeSpring(parent, relativePosition) {
	const hitbox = new RectHitbox(parent, relativePosition.addPoint({x: 0, y:4}), 8, 4);

	const physObj = new PhysObj(
		hitbox,
		new DummyUpdateHandler(),
		new CollisionHandlers.TagOnly(
			[new CollisionHandlers.Spring(-0.22)]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new DrawableEntity(
        hitbox,
        new AnimatedSprite(
            SPRITES.SPRING_SPRITESHEET,
            [
                {frames: 1, onComplete: "stop"},
                // {frames: 6, onComplete: "loop", nth: 10},
                // {frames: 1, onComplete: "stay", nth: 1}
            ]
        ),
        Vector({x: 0, y: -4})
    );
	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [hitbox];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];

	return ret;
}