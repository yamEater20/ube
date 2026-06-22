import * as CustomCollisionHandlers from "../customCollisionHandlers.js";
import { Vector } from "../engine/math.js";
import { PhysObj } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as Sprites from "../engine/sprites.js";
import { ResetAtSpawn } from "../reset.js";
import { POOL_TYPES } from "../pools.js";

export function makePushableBox(hitbox, updateHandler, collidableProvider, groundedProvider) {
	const position = Vector({x: hitbox.relativePosition.x, y: hitbox.relativePosition.y});
	const physObj = new PhysObj(
		hitbox,
		updateHandler,
		new CollisionHandlers.Composite(
			[
				new CollisionHandlers.Ground(),
				new CollisionHandlers.PushableBox(),
				new CollisionHandlers.Ridable()
			],
			[
				//TODO: figure out lifetimes. These are stateless and should be singletons.
				new CollisionHandlers.PushableBoxReaction(),
				new CollisionHandlers.WallReaction(),
				new CollisionHandlers.GroundReaction(groundedProvider)
			]
		),
		collidableProvider
	);

	const drawableEntity = new DrawableEntity(
        physObj,
        new Sprites.AnimatedSprite(
            Sprites.SPRITE_LK.BUTTON,
            [{"frames": 0, onComplete: "stop"}, {"frames": 6, onComplete: "stop", nth: 10}]
        )
    );

	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.UPDATEABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [hitbox];
	ret[POOL_TYPES.DRAWABLE] = [{item: drawableEntity, layer: 5}];
	ret[POOL_TYPES.RESETTABLE] = [physObj, new ResetAtSpawn(hitbox, position)];
	return ret;
}