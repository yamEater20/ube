import { Timer } from "../engine/time.js";
import { GRAVITY_COMING_DOWN, GRAVITY_GOING_UP, HitboxDrawableEntity, PhysObj, RectHitbox } from "../engine/physics.js";
import { framesToMs, VectorZero } from "../engine/math.js";
import * as CollisionHandlers from "../collisionHandlers.js";
import * as Sprites from "../engine/sprites.js";
import { UpdatableDrawableEntity } from "../engine/drawableEntity.js";
import { Vector } from "../engine/math.js";
import { ResetAtSpawn } from "../reset.js";
import * as GeneralUpdateHandlers from "../physUpdateHandlers.js";
import { debugOptions } from "../engine/debug.js";
import {POOL_TYPES} from "../pools.js";

//TODO: provide constants for magic numbers

class FallUpdateHandler {
	constructor(generalFallUpdateHandler) {
		this._otherFallUpdateHandler = generalFallUpdateHandler;
	}

	update(physObj, timeDelta, input) {
		let gravity = GRAVITY_COMING_DOWN;
		const yv = physObj.getYVelocity();
		if (input.jump && yv <= 0) gravity = GRAVITY_GOING_UP;
		this._otherFallUpdateHandler.update(physObj, timeDelta, gravity);
	}
}

function jump(physObj, jumpV) {
	//TODO: play around with yv/2.
	physObj.setYVelocity(jumpV);
}

class JumpUpdateHandler {
	constructor() {
		this._jumpJustPressed = new Timer();
		this._coyoteTime = new Timer();
	}

	update(physObj, timeDelta, input) {
		if (input.jumpPressed) {
			this._jumpJustPressed.restart(framesToMs(8));
		}

		const shouldJumpFromBuffer = input.grounded && this._jumpJustPressed.running();
		const shouldJumpFromCoyote = input.jumpPressed && this._coyoteTime.running();
		if (shouldJumpFromBuffer || shouldJumpFromCoyote) {
			jump(physObj, -0.17);
			this._coyoteTime.stop();
			this._jumpJustPressed.stop();
			input.jumpedThisFrame = true;
		} else if (input.grounded) {
			this._coyoteTime.restart(framesToMs(8));
		}

		this._jumpJustPressed.update(timeDelta);
		this._coyoteTime.update(timeDelta);
	}
}

export class DoubleJumpHandler {
	constructor() {
		this._canDoubleJump = false;
	}

	update(physObj, timeDelta, input) {
		if (input.grounded) {
			this._canDoubleJump = true;
		} else if (input.jumpPressed && this._canDoubleJump && !input.jumpedThisFrame) {
			jump(physObj, -0.145);
			this._canDoubleJump = false;
		}
	}

	refresh() {
		this._canDoubleJump = true;
	}
}

class HorizontalUpdateHandler {
	update(physObj, timeDelta, input) {
		if (input.moveLeft) physObj.setXVelocity(-0.1);
		else if (input.moveRight) physObj.setXVelocity(0.1);
		else {
			const fric = input.grounded ? 0.004 : 0.001;
			const xv = physObj.getXVelocity();
			if (Math.abs(xv) < 0.01) {
				physObj.setXVelocity(0);
			} else if (xv > 0) {
				physObj.setXVelocity(Math.max(0, xv - fric * timeDelta));
			} else if (xv < 0) {
				physObj.setXVelocity(Math.min(0, xv + fric * timeDelta));
			}
		}
	}
}

class UpdateHandler {
	constructor(inputProvider, groundedProvider, updateHandlers) {
		this._inputProvider = inputProvider;
		this._groundedProvider = groundedProvider;
		this._updateHandlers = updateHandlers;
		this._debugUpdateHandler = new DebugUpdateHandler();
	}

	update(physObj, timeDelta) {
		const input = this._inputProvider.getInput();
		if (debugOptions.noClip) {
			this._debugUpdateHandler.update(physObj, timeDelta, input);
		} else {
			input.grounded = this._groundedProvider.onGround(physObj);
			this._updateHandlers.forEach(u => u.update(physObj, timeDelta, input));
		}
	}
}

class DebugUpdateHandler {
	update(physObj, timeDelta, input) {
		const signX = input.moveLeft ? -1 : (input.moveRight ? 1 : 0);
		const signY = input.moveUp ? -1 : (input.moveDown ? 1 : 0);
		physObj.setXVelocity(0.3 * signX);
		physObj.setYVelocity(0.3 * signY);
	}
}

class CollisionHandlerDebugDecorator {
	constructor(businessHandler, debugReactions) {
		this._businessHandler = businessHandler;
		this._debugReactions = debugReactions;
	}

	getTags() {
		return debugOptions.noClip ? [] : this._businessHandler.getTags();
	}

	getReactions() {
		return debugOptions.noClip ? this._debugReactions : this._businessHandler.getReactions();
	}

	containsTag(tag) {
		if (debugOptions.noClip) return false;
		return this._businessHandler.containsTag(tag);
	}

	getTag(tag) {
		throw new Error("Not implemented");
	}

	onCollide(physObj, other, direction) {
		return this._businessHandler.onCollide(physObj, other, direction);
	}
}

class DrawableUpdateHandler {
	constructor(physObj, groundedProvider) {
		this._physObj = physObj;
		this._groundedProvider = groundedProvider;
	}

	update(timeDelta, drawableEnity) {
		const xv = this._physObj.getXVelocity();
		const drawable = drawableEnity.drawable;
		if (xv > 0) {
			drawable.options.flip = true;
		} else if (xv < 0) {
			drawable.options.flip = false;
		}

		if (this._physObj.getYVelocity() !== 0 && !this._groundedProvider.onGround(this._physObj)) {
			drawable.setRow(2);
		} else if (xv !== 0) {
			drawable.setRow(1);
		} else {
			drawable.setRow(0);
		}

		drawable.update(timeDelta);
	}
}

class NonRidableCollidableProvider {
	constructor (collidableProvider) {
		this._collidableProvider = collidableProvider;
	}

	getAllRiding(physObj) {
		return [];
	}

	getAllColliding(physObj, offset) {
        return this._collidableProvider.getAllColliding(physObj, offset);
    }
}

class SpringReaction extends CollisionHandlers.SpringReaction {
	constructor(doubleJumpHandler) {
		super();
		this._doubleJumpHandler = doubleJumpHandler;
	}
	
	react(physObj, other, spring, direction) {
        this._doubleJumpHandler.refresh();
		return super.react(physObj, other, spring, direction);
    }
}

export class SpikeReaction extends CollisionHandlers.SpikeReaction {
    constructor(onSpikeCollide) {
        super();
		this._onSpikeCollide = onSpikeCollide;
    }
	react(physObj, otherPhysObj, spike, direction) {
        if (spike.movingInto(physObj.velocity)) {
			this._onSpikeCollide("hjello");
		}
		return false;
    }
}

export function make(parent, position, inputProvider, groundedProvider, collidableProvider, onRoomCollide, killPlayer) {
	const hitbox = new RectHitbox(VectorZero, 6, 6);

	const roomColliderReaction = new CollisionHandlers.RoomColliderReaction(onRoomCollide);
	const doubleJumpHandler = new DoubleJumpHandler();
	const physObj = new PhysObj(
		parent,
		position,
		hitbox,
		new UpdateHandler(
			inputProvider,
			groundedProvider,
			[
				new FallUpdateHandler(new GeneralUpdateHandlers.FallUpdateHandler(groundedProvider)),
				new JumpUpdateHandler(),
				doubleJumpHandler,
				new HorizontalUpdateHandler()
			]
		),
		new CollisionHandlerDebugDecorator(
			new CollisionHandlers.Composite(
				[
					new CollisionHandlers.Wall(),
					new CollisionHandlers.Ground(),
					new CollisionHandlers.Ridable()
				],
				[
					new CollisionHandlers.PushableBoxReaction(),
					new CollisionHandlers.WallReaction(),
					new CollisionHandlers.GroundReaction(groundedProvider),
					new SpringReaction(doubleJumpHandler),
					new SpikeReaction(killPlayer),
					roomColliderReaction
				]
			),
			[roomColliderReaction]
		),
		new NonRidableCollidableProvider(collidableProvider)
	);

	const drawableEntity = new UpdatableDrawableEntity(
		physObj,
		new Sprites.AnimatedSprite(
			Sprites.SPRITES.MAIN_CHARA_SPRITESHEET,
			[
				{frames: 1, onComplete: "stop"},
				{frames: 6, onComplete: "loop", nth: 10},
				{frames: 1, onComplete: "stay", nth: 1}],
			null
		),
		new DrawableUpdateHandler(physObj, groundedProvider),
		Vector({x: -1, y: -2})
	);

	const ret = {};

	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];
	ret[POOL_TYPES.UPDATEABLE] = [drawableEntity, physObj];
	ret[POOL_TYPES.RESETTABLE] = [physObj, new ResetAtSpawn(physObj, position)];
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox, "#00ff0060")];
	// ret[POOL_TYPES.DRAWABLE] = [hitbox];
	// ret[POOL_TYPES.CAMERA_FOLLOW] = [hitbox];

	return ret;
}