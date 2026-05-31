import { getFallV } from "./engine/physics.js";
import { VectorDown } from "./engine/math.js";
import { TAG_IDS } from "./collisionHandlers.js";

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
			.getAllColliding(p, VectorDown)
			.filter(physObj => {
				const ground = physObj.collisionHandler.getTag(TAG_IDS.GROUND);
				return ground && ground.isGround(p, physObj, VectorDown);
			});
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