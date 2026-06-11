import {
	Vector,
	VectorZero,
} from './math.js';

import { Entity } from './entity.js';

const MAXFALL = 0.2;
const GRAVITY_GOING_UP = 4.4 / 10000;
const GRAVITY_COMING_DOWN = 8 / 10000;

class RectHitbox {
    constructor(relativePosition, width, height) {
		this.relativePosition = relativePosition;
		this.width = width;
		this.height = height;
    }

	cloneOffset(v) {
		return new RectHitbox(this.relativePosition.addPoint(v), this.width, this.height);
	}
}

class HitboxDrawableEntity extends Entity {
	constructor(parent, hitbox, color) {
		super(parent, VectorZero);
		this._hitbox = hitbox;
		this._color = color ?? "#ff000040";
	}

	draw(camera) {
		const relativePosition = this._hitbox.relativePosition;
		const pos = this.globalPosition().addPoint(relativePosition).trunc();
		camera.drawRect(
			pos.x,
			pos.y,
			this._hitbox.width,
			this._hitbox.height,
			this._color
		);

		camera.drawRectOutline(
			pos.x+0.5,
			pos.y+0.5,
			this._hitbox.width-1,
			this._hitbox.height-1,
			this._color
		);
	}
}

function hitboxInfo(physObjA, physObjB) {
	return {
		hitboxA: physObjA.hitbox,
		hitboxB: physObjB.hitbox,
		posA: physObjA.globalPosition().addPoint(physObjA.hitbox.relativePosition),
		posB: physObjB.globalPosition().addPoint(physObjB.hitbox.relativePosition)
	}
}

function isOverlap(physObjA, physObjB, offset) {
	const info = hitboxInfo(physObjA, physObjB);
	const xa = info.posA.x + offset.x;
	const ya = info.posA.y + offset.y;
	const xb = info.posB.x;
	const yb = info.posB.y;
	const ret = (
		xa < xb + info.hitboxB.width &&
		xa + info.hitboxA.width > xb &&
		ya < yb + info.hitboxB.height &&
		ya + info.hitboxA.height > yb
	);
	return ret;
}

// function isTouching(hitboxA, hitboxB) {
// 	return (
// 		hitboxA.isOnTopOf(hitbox) ||
// 		hitboxA.isUnder(hitbox) ||
// 		hitboxA.isLeftOf(hitbox) ||
// 		hitboxA.isRightOf(hitbox)
// 	)
// }

function isOnTopOf(physObjA, physObjB) {
	const info = hitboxInfo(physObjA, physObjB);
	const posA = info.posA;
	const posB = info.posB;
	return (
		posA.y + info.hitboxA.height === posB.y &&
		posA.x + info.hitboxA.width > posB.x &&
		posB.x + info.hitboxB.width > posA.x
	);
}

function isLeftOf(physObjA, physObjB) {
	const info = hitboxInfo(physObjA, physObjB);
	const posA = info.hitboxA.globalPosition();
	const posB = info.hitboxB.globalPosition();
	return (
		posA.x + info.hitboxA.width === posB.x &&
		posA.y < posB.y + info.hitboxB.height &&
		posA.y + info.hitboxA.height > posB.y
	);
}

function isUnder(physObjA, physObjB) {
	return isOnTopOf(physObjA, physObjB);
}

function isRightOf(physObjA, physObjB) {
	return isLeftOf(physObjA, physObjB);
}

class PhysObj extends Entity {
	constructor(parent, relativePosition, hitbox, updateHandler, collisionHandler, collidableProvider) {
		super(parent, relativePosition);
		this.velocity = Vector({x: 0, y: 0});
		this.subpixels = Vector({x: 0, y: 0});
		this.hitbox = hitbox;

		this.updateHandler = updateHandler;
		this.collisionHandler = collisionHandler;
		this._collidableProvider = collidableProvider;
	}

	setXVelocity(vx) {
		this.velocity.x = vx;
	}

	setYVelocity(vy) {
		this.velocity.y = vy;
	}

	getXVelocity() {
		return this.velocity.x;
	}

	getYVelocity() {
		return this.velocity.y;
	}

	setVelocity(v) {
		this.velocity.x = v.x;
		this.velocity.y = v.y;
	}

	update(timeDelta) {
		this.updateHandler.update(this, timeDelta);
		this.move(this.velocity.scalar(timeDelta));
	}

	isOverlap(physObj, offset) {
		return this !== physObj && isOverlap(this, physObj, offset);
	}

	isOnTopOf(physObj) {
		return isOnTopOf(this, physObj);
	}

	isUnder(physObj) {
		return isUnder(this, physObj);
	}

	isLeftOf(physObj) {
		return isLeftOf(this, physObj);
	}

	isRightOf(physObj) {
		return isRightOf(this, physObj);
	}

	checkBehavior(funcName, ...args) {
		return this.colliderBehaviors.some(
			b => b[funcName] && b[funcName](...args)
		);
	}

	move(amount) {
		let remainder = amount.addPoint(this.subpixels).trunc();
		this.subpixels = amount.addPoint(this.subpixels).subtract(remainder);
		const directionX = Vector({x: Math.sign(remainder.x), y: 0});
		const directionY = Vector({x: 0, y: Math.sign(remainder.y)});

		this.moveDirection(remainder.x, directionX);
		this.moveDirection(remainder.y, directionY);
	}

	moveDirection(amount, direction) {
		const directionScalar = direction.x + direction.y;
		let didCollide = false;
		while (amount !== 0) {
			const allRiding = this._collidableProvider.getAllRiding(this);
			const allColliding = this._collidableProvider.getAllColliding(this, direction).filter(p => !allRiding.includes(p));
			
			didCollide = this.collisionHandler.onCollide(this, allColliding, direction);

			if (didCollide) {
				if (direction.x !== 0) this.subpixels.x = 0;
				if (direction.y !== 0) this.subpixels.y = 0;
				break;
			}

			allRiding.forEach(actor => {
				actor.moveDirection(directionScalar, direction);
			});
			this.relativePosition = this.relativePosition.addPoint(direction);
			amount -= directionScalar;
		}

		return didCollide;
	}

	reset() {
		this.velocity = Vector({x: 0, y: 0});
		this.subpixels = Vector({x: 0, y: 0});
	}
}

class DummyCollisionHandler {
	onCollide(physObj, other, direction) {
		return true;
	}
}

class DummyCollidableProvider {
	getAllRiding(physObj) {return [];}

	getAllColliding(physObj, offset) {
		return [];
    }
}

class DummyUpdateHandler {
	update(physObj, timeDelta) {}
}

function getFallV(vy, timeDelta, gravity) {
	gravity = gravity ?? (vy > 0 ? GRAVITY_COMING_DOWN : GRAVITY_GOING_UP);
	return Math.min(MAXFALL, vy + timeDelta * gravity);
}

export {
    PhysObj,
	RectHitbox,
	HitboxDrawableEntity,
	DummyCollisionHandler,
	DummyCollidableProvider,
	DummyUpdateHandler,

	GRAVITY_COMING_DOWN,
	GRAVITY_GOING_UP,
	getFallV
}