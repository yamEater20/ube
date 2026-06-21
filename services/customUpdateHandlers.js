import { getFallV } from "../engine/physics.js";
import { VectorDown } from "../engine/math.js";
import { TAG_IDS } from "./entityCollisionHandlers.js";

export class Composite {
	constructor(handlers) {
		this._handlers = handlers;
	}

	update(physObj, timeDelta) {
		this._handlers.forEach(u => u.update(physObj, timeDelta));
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

	update(physObj, timeDelta, gravity) {
		const yv = physObj.getYVelocity();
		if (!this._groundedProvider.onGround(physObj))
			physObj.setYVelocity(getFallV(yv, timeDelta, gravity));
	}
}

export class FallAirResistanceUpdateHandler {
	constructor(fallUpdateHandler, gravity, airResistance) {
		this._fallUpdateHandler = fallUpdateHandler;
		this._gravity = gravity;
		this._airResistance = airResistance;
	}

	update(physObj, timeDelta) {
		this._fallUpdateHandler.update(physObj, timeDelta, this._gravity);
		physObj.velocity = physObj.velocity.scalar(this._airResistance);
	}
}

export class MovingGuy {
	update(physObj, timeDelta) {
		physObj.setXVelocity(0.01);
	}
}