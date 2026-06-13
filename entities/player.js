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

class IPlayerUpdateHandler {
	update(physObj, timeDelta, input) {}
	reset() {}
}

class FallUpdateHandler extends IPlayerUpdateHandler {
	constructor(generalFallUpdateHandler) {
		super();
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

class JumpUpdateHandler extends IPlayerUpdateHandler {
	constructor() {
		super();
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

	reset() {
		this._jumpJustPressed.stop();
		this._coyoteTime.stop();
	}
}

class FacingHandler extends IPlayerUpdateHandler {
	constructor() {
		super();
		this._facing = 0;
	}

	update(physObj, timeDelta, input) {
		if (input.moveLeft) this._facing = -1;
		if (input.moveRight) this._facing = 1;
		input.facing = this._facing;
	}

	reset() {this._facing = -1;}
}

class SlideHandler extends IPlayerUpdateHandler {
	constructor() {
		super();
		this._slideJustPressed = new Timer();
		this._xoyoteTime = new Timer();

		this._isSliding = false;
		this._slideDirection = 0;
	}

	update(physObj, timeDelta, input) {
		if (input.slidePressed) {
			this._slideJustPressed.restart(framesToMs(8));
		}

		const shouldSlideFromBuffer = input.grounded && this._slideJustPressed.running();
		const shouldSlideFromCoyote = input.slidePressed && this._xoyoteTime.running();
		if (shouldSlideFromBuffer || shouldSlideFromCoyote) {
			this._isSliding = true;
			this._slideDirection = input.facing;
			this._slideJustPressed.stop();
			this._xoyoteTime.stop();
		} else if (input.grounded) {
			this._xoyoteTime.restart(framesToMs(8));
		}

		input.sliding = this._isSliding;
		input.slideDirection = this._slideDirection;
		this._slideJustPressed.update(timeDelta);
		this._xoyoteTime.update(timeDelta);
	}

	isSliding() {return this._isSliding; }
	facing() { return this._slideDirection; }

	stopSliding() {
		this._isSliding = false;
	}

	reset() {
		this._isSliding = false;
		this._slideJustPressed.stop();
		this._xoyoteTime.stop();
	}
}

class DoubleJumpHandler extends IPlayerUpdateHandler {
	constructor() {
		super();
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

	reset() {
		this._canDoubleJump = true;
	}

	refresh() {
		this._canDoubleJump = true;
	}
}

class HorizontalUpdateHandler extends IPlayerUpdateHandler {
	update(physObj, timeDelta, input) {
		if (input.sliding) {
			physObj.setXVelocity(0.2 * input.slideDirection);
			return;
		}

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

	reset () {
		this._updateHandlers.forEach(u => u.reset());
	}
}

class DebugUpdateHandler extends IPlayerUpdateHandler {
	update(physObj, timeDelta, input) {
		const signX = input.moveLeft ? -1 : (input.moveRight ? 1 : 0);
		const signY = input.moveUp ? -1 : (input.moveDown ? 1 : 0);
		physObj.setXVelocity(0.3 * signX);
		physObj.setYVelocity(0.3 * signY);
	}
}

class DrawableUpdateHandler extends IPlayerUpdateHandler {
	constructor(drawable, slideHandler) {
		super();
		this._drawable = drawable;
		this._slideHandler = slideHandler;
	}

	update(physObj, timeDelta, input) {
		const drawable = this._drawable;
		
		if (this._slideHandler.isSliding()) {
			drawable.options.flip = this._slideHandler.facing() > 0;
		} else if (input.facing > 0) {
			drawable.options.flip = true;
		} else if (input.facing < 0) {
			drawable.options.flip = false;
		}

		let row = 0;
		if (physObj.getYVelocity() !== 0 && !input.grounded) {
			row = 2;
		} else if (physObj.getXVelocity() !== 0) {
			row = 1;
		}

		drawable.setRow(row);
		drawable.update(timeDelta);
	}
}

class SlideBumpHandler extends IPlayerUpdateHandler {
	constructor() {
		super();
		this._bumpTimer = new Timer();
		this._bumpTimer.stop();
		this._bumpFacing = 0;
	}

	update(physObj, timeDelta, input) {
		//Overrides all the other update handlers by setting velocity
		
		if (this._bumpTimer.running()) {
			physObj.setXVelocity(this._bumpFacing * -0.07);
			physObj.setYVelocity(-0.07);
			this._bumpTimer.update(timeDelta);
		}
	}

	slideBump(facing) {
		this._bumpFacing = facing;
		this._bumpTimer.restart(framesToMs(8));
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

class WallReaction extends CollisionHandlers.WallReaction {
	constructor(slideHandler, slideBumpHandler) {
		super();
		this._slideHandler = slideHandler;
		this._slideBumpHandler = slideBumpHandler;
	}

	react(physObj, other, wall, direction) {
		if (wall.shouldStopMoving(other, physObj, direction) && this._slideHandler.isSliding()) {
			this._slideBumpHandler.slideBump(this._slideHandler.facing());
			this._slideHandler.stopSliding();
		}
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
    constructor(onSpikeCollide, slideHandler) {
        super();
		this._onSpikeCollide = onSpikeCollide;
		this._slideHandler = slideHandler;
    }
	react(physObj, otherPhysObj, spike, direction) {
		const isSliding = this._slideHandler.isSliding();
		if ((isSliding && spike.directionVector.y >= 0) || (!isSliding && spike.movingInto(physObj.velocity))) {
			this._onSpikeCollide();
		}
    }
}

export function make(parent, position, inputProvider, groundedProvider, collidableProvider, spawnPositionProvider, onRoomCollide, killPlayer) {
	const hitbox = new RectHitbox(VectorZero, 6, 6);

	const roomColliderReaction = new CollisionHandlers.RoomColliderReaction(onRoomCollide);
	const doubleJumpHandler = new DoubleJumpHandler();
	const slideHandler = new SlideHandler();
	const slideBumpHandler = new SlideBumpHandler();

	const drawable = new Sprites.AnimatedSprite(
		Sprites.SPRITES.MAIN_CHARA_SPRITESHEET,
		[
			{frames: 1, onComplete: "stop"},
			{frames: 6, onComplete: "loop", nth: 10},
			{frames: 1, onComplete: "stay", nth: 1}
		]
	);
	
	const updateHandler = new UpdateHandler(
		inputProvider,
		groundedProvider,
		[
			new FacingHandler(),
			new FallUpdateHandler(new GeneralUpdateHandlers.FallUpdateHandler(groundedProvider)),
			new JumpUpdateHandler(),
			doubleJumpHandler,
			slideHandler,
			new HorizontalUpdateHandler(),
			new DrawableUpdateHandler(drawable, slideHandler),
			slideBumpHandler
		]
	);

	const physObj = new PhysObj(
		parent,
		position,
		hitbox,
		updateHandler,
		new CollisionHandlerDebugDecorator(
			new CollisionHandlers.Composite(
				[
					new CollisionHandlers.Wall(),
					new CollisionHandlers.Ground(),
					new CollisionHandlers.Ridable()
				],
				[
					new WallReaction(slideHandler, slideBumpHandler),
					new CollisionHandlers.GroundReaction(groundedProvider),
					new SpringReaction(doubleJumpHandler),
					new SpikeReaction(killPlayer, slideHandler),
					roomColliderReaction
				]
			),
			[roomColliderReaction]
		),
		new NonRidableCollidableProvider(collidableProvider)
	);

	const drawableEntity = new UpdatableDrawableEntity(
		physObj,
		drawable,
		Vector({x: -1, y: -2})
	);

	const ret = {};

	ret[POOL_TYPES.DRAWABLE] = [drawableEntity];
	ret[POOL_TYPES.UPDATEABLE] = [drawableEntity, physObj];
	ret[POOL_TYPES.RESETTABLE] = [physObj, new ResetAtSpawn(physObj, spawnPositionProvider), updateHandler];
	ret[POOL_TYPES.COLLIDABLE] = [physObj];
	ret[POOL_TYPES.DRAWABLE_DEBUG] = [new HitboxDrawableEntity(physObj, hitbox, "#00ff0060")];
	// ret[POOL_TYPES.DRAWABLE] = [hitbox];
	// ret[POOL_TYPES.CAMERA_FOLLOW] = [hitbox];

	return ret;
}