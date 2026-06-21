import { TAG_IDS } from "./entityCollisionHandlers.js";
import { VectorDown } from "../engine/math.js";

export class CollidableProvider {
	constructor (pool) {
		this._pool = pool;
	}

    getAllRiding(physObj) {
		return this._pool.get().filter(
			p =>
				p != physObj &&
				p.isOverlap(physObj, VectorDown) &&
				p.collisionHandler.containsTag(TAG_IDS.RIDABLE)
			);
	}

	getAllColliding(physObj, offset) {
        return this._pool.get().filter(p => physObj.isOverlap(p, offset));
    }

	concat(otherPool) {
		return new CollidableProvider(this.get().concat(otherPool.get()));
	}
}