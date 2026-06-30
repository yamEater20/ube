import { RectHitbox, PhysObj, DummyCollidableProvider, DummyUpdateHandler, HitboxDrawableEntity } from "../engine/physics.js";
import { DrawableEntity, UpdatableDrawableEntity } from "../engine/drawableEntity.js";
import * as CustomCollisionHandlers from "../services/entityCollisionHandlers.js";
import { POOL_TYPES } from "./poolTypes.js";
import { AnimatedSprite, SPRITE_LK } from "../engine/sprites.js";
import { Vector } from "../engine/math.js";
import { Tags } from "../services/customCollisionHandlers.js";

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
		]
	);

	const springParticleOptions = {
		numParticlesFunction: () => Math.random() * 3 + 5,
		fadeTimeFunction: () => Math.random() * 500 + 3000,
		color: "#ff004d",
		spawnArea: Vector({x: 8, y: 0}),
		initialVelocityFunction: (normalizedSpawnPosition) => Vector({
			x: normalizedSpawnPosition.x * 0.1,
			y: -(Math.random() * 0.05 + 0.05)
		})
	};
	const springParticleGenerationPosition = relativePosition.addPoint(visiblePosition).add(4, 0);

	const physObj = new PhysObj(
		parent,
		relativePosition,
		hitbox,
		new DummyUpdateHandler(),
		new Tags(
			[new SpringTagAnimated(
				-0.26,
				sprite,
				() => entityData.onBounce(parent, springParticleGenerationPosition, springParticleOptions)
			)]
		),
		new DummyCollidableProvider(),
	);

	const drawableEntity = new UpdatableDrawableEntity(physObj, sprite);

	const ret = {};
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox)];
	ret[POOL_TYPES.DRAWABLE] = [{item: drawableEntity, layer: 5}];
	ret[POOL_TYPES.UPDATEABLE] = [drawableEntity];
	ret[POOL_TYPES.RESETTABLE] = [drawableEntity];

	return ret;
}