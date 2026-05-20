import { getDefaultFallV } from "./physics.js";
import { VectorDown } from "./math.js";

export class GroundedProvider {
	constructor(collidableProvider) {
		this._collidableProvider = collidableProvider;
	}

	onGround(p) {
		const onTopOf = this._collidableProvider.getAllCollidingExcept(p, VectorDown, []);
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