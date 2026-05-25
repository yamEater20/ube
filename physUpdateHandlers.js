import { getFallV } from "./engine/physics.js";
import { VectorDown } from "./engine/math.js";
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

	update(physObj, time, gravity) {
		const yv = physObj.getYVelocity();
		if (!this._groundedProvider.onGround(physObj))
			physObj.setYVelocity(getFallV(yv, time.delta, gravity));
	}
}

export class MovingGuy {
	update(physObj, time) {
		physObj.setXVelocity(0.01);
	}
}