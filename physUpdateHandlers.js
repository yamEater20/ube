import { getDefaultFallV } from "./physics.js";
import { VectorDown } from "./math.js";
import { AdjectiveIds } from "./collisionHandlers.js";

export class Composite {
	constructor(handlers) {
		this._handlers = handlers;
	}

	update(physObj, time) {
		this._handlers.forEach(u => u.update(physObj, time));
	}
}

export class GroundedProvider {
	constructor(collidableProvider) {
		this._collidableProvider = collidableProvider;
	}

	onGround(p) {
		const onTopOf = this._collidableProvider
			.getAllCollidingExcept(p, VectorDown, [])
			.filter(physObj => physObj.collisionHandler.containsAdjective(AdjectiveIds.GROUND));
		return onTopOf.length > 0;
	}
}

export class FallUpdateHandler {
	constructor(groundedProvider) {
		this._groundedProvider = groundedProvider;
	}

	update(physObj, time) {
		// if (this._groundedProvider.onGround(physObj))
		// 	physObj.setYVelocity(0); //will cause problems later
		// else
		// 	physObj.setYVelocity(getDefaultFallV(physObj.getYVelocity(), time.delta));
		if (!this._groundedProvider.onGround(physObj))
			physObj.setYVelocity(getDefaultFallV(physObj.getYVelocity(), time.delta));
	}
}

export class MovingGuy {
	update(physObj, time) {
		physObj.setXVelocity(0.05);
	}
}