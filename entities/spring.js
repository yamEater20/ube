import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler, HitboxDrawableEntity } from "../engine/physics.js";
import { DrawableEntity, UpdatableDrawableEntity } from "../engine/drawableEntity.js";
import * as CustomCollisionHandlers from "../services/entityCollisionHandlers.js";
import { POOL_TYPES } from "./poolTypes.js";
import { AnimatedSprite, SPRITE_LK } from "../engine/sprites.js";
import { Vector } from "../engine/math.js";
import { TagOnly } from "../services/customCollisionHandlers.js";
import { Composite } from "../services/customUpdateHandlers.js";

class SpringTagAnimated extends CustomCollisionHandlers.Spring{
	constructor(bounceV, animatedSprite, onBounceCallback) {
		super(bounceV);
		this._animatedSprite = animatedSprite;
		this._onBounceCallback = onBounceCallback;
	}

	onBounce() {
		this._animatedSprite.setRow(1);
		this._onBounceCallback();
	}
}

export function makeSpring(parent, relativePosition, entityData) {
	const visiblePosition = Vector({x: 0, y: 4});
	
	const hitboxWidth = 8;
	const hitbox = new RectHitbox(visiblePosition, hitboxWidth, 4);
	const sprite = new AnimatedSprite(
		SPRITE_LK.SPRING_SPRITESHEET,
		[
			{frames: 1, onComplete: "stop"},
			{frames: 15, onComplete: "stop", nth: 1},
			// {frames: 1, onComplete: "stay", nth: 1}
		]
	);

	const springParticleGenerationPosition = relativePosition.addPoint(visiblePosition);

	const physObj = new PhysObj(
		parent,
		relativePosition,
		hitbox,
		new DummyUpdateHandler(),
		new TagOnly(
			[new SpringTagAnimated(
				-0.26,
				sprite,
				() => entityData.onBounce(parent, springParticleGenerationPosition, hitboxWidth)
			)]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new UpdatableDrawableEntity(physObj, sprite);

	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox)];
	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];
	ret[POOL_TYPES.UPDATEABLE] = [drawableEntity];
	ret[POOL_TYPES.RESETTABLE] = [drawableEntity];

	return ret;
}