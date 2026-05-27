import * as CollisionHandlers from "../collisionHandlers.js";
import { Vector } from "../engine/math.js";
import { PhysObj } from "../engine/physics.js";
import { DrawableEntity } from "../engine/drawableEntity.js";
import * as Sprites from "../engine/sprites.js";
import { ResetAtSpawn } from "../reset.js";
import { POOL_TYPES } from "../pools.js";

export function makePushableBox(hitbox, updateHandler, collidableProvider, groundedProvider, registrar) {
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
            Sprites.SPRITES.BUTTON,
            [{"frames": 0, onComplete: "stop"}, {"frames": 6, onComplete: "stop", nth: 10}]
        )
    );

	registrar.registerItem(POOL_TYPES.COLLIDABLE, physObj);
	registrar.registerItem(POOL_TYPES.UPDATEABLE, physObj);
	registrar.registerItem(POOL_TYPES.DRAWABLE_DEBUG, physObj);
	registrar.registerItem(POOL_TYPES.RESETTABLE, physObj);
	
	registrar.registerItem(POOL_TYPES.DRAWABLE, drawableEntity);
	registrar.registerItem(POOL_TYPES.RESETTABLE, new ResetAtSpawn(hitbox, position));
}