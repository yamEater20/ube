import {
	Vector,
} from './math.js';

import { Entity } from './entity.js';

const MAXFALL = 0.2;
const GRAVITY_GOING_UP = 4.4 / 10000;
const GRAVITY_COMING_DOWN = 8 / 10000;

class RectHitbox extends Entity {
    constructor(parent, relativePosition, width, height, color) {
		super(parent, relativePosition);
		this.width = width;
		this.height = height;

		this._color = color ?? "#ff000030";
    }

	toStr() {
		return `x: ${this.globalPosition().x} y: ${this.globalPosition().y} w: ${this.width} h: ${this.height}`;
	}

	cloneOffset(v) {
		return new RectHitbox(this.parent, this.relativePosition.addPoint(v), this.width, this.height);
	}

	draw(camera) {
		const pos = this.globalPosition().trunc();
		camera.drawRect(
			pos.x,
			pos.y,
			this.width,
			this.height,
			this._color
		);

		camera.drawRectOutline(
			pos.x+0.5,
			pos.y+0.5,
			this.width-1,
			this.height-1,
			this._color
		)
	}
}

function isOverlap(hitboxA, hitboxB) {
	const pos = hitboxA.globalPosition();
	const otherPos = hitboxB.globalPosition();
	let x = pos.x;
	let y = pos.y;
	let rx = otherPos.x;
	let ry = otherPos.y;
	return (x < rx + hitboxB.width &&
		x + hitboxA.width > rx &&
		y < ry + hitboxB.height &&
		y + hitboxA.height > ry);
}

function isTouching(hitboxA, hitboxB) {
	return (
		hitboxA.isOnTopOf(hitbox) ||
		hitboxA.isUnder(hitbox) ||
		hitboxA.isLeftOf(hitbox) ||
		hitboxA.isRightOf(hitbox)
	)
}

function isOnTopOf(hitboxA, hitboxB) {
	const otherPos = hitboxB.globalPosition();
	const pos = hitboxA.globalPosition();
	return (
		pos.y + hitboxA.height === otherPos.y &&
		pos.x + hitboxA.width > otherPos.x &&
		otherPos.x + hitboxB.width > pos.x
	);
}

function isLeftOf(hitboxA, hitboxB) {
	const pos = hitboxA.globalPosition();
	const otherPos = hitboxB.globalPosition();
	return (
		pos.x + hitboxA.width === otherPos.x &&
		pos.y < otherPos.y + hitboxB.height &&
		pos.y + hitboxA.height > otherPos.y
	);
}

function isUnder(hitboxA, hitboxB) {
	return isOnTopOf(hitboxB, hitboxA);
}

function isRightOf(hitboxA, hitboxB) {
	return isLeftOf(hitboxB, hitboxA);
}

class PhysObj extends Entity {
	constructor(parent, updateHandler, collisionHandler, collidableProvider) {
		super(parent);
		this.velocity = Vector({x: 0, y: 0});
		this.subpixels = Vector({x: 0, y: 0});

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

	update(time) {
		this.updateHandler.update(this, time);
		this.move(this.velocity.scalar(time.delta));
	}

	move(x, y) {
		throw new Error("implement move in subclass PhysObj");
	}

	isOverlap(physObj, offset) {
		return this !== physObj && isOverlap(this.parent.cloneOffset(offset), physObj.parent);
	}

	isOnTopOf(physObj) {
		return isOnTopOf(this.parent, physObj.parent);
	}

	isUnder(physObj) {
		return isUnder(this.parent, physObj.parent);
	}

	isLeftOf(physObj) {
		return isLeftOf(this.parent, physObj.parent);
	}

	isRightOf(physObj) {
		return isRightOf(this.parent, physObj.parent);
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
			let shouldBreak = false;
			allColliding.some(c => {
				if (this.collisionHandler.onCollide(this, c, direction)) {
					shouldBreak = true;
					return true;
				}
			});
			if (shouldBreak) {
				didCollide = true;
				break;
			}

			allRiding.forEach(actor => {
				actor.moveDirection(directionScalar, direction);
			});
			this.parent.relativePosition = this.parent.relativePosition.addPoint(direction);
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
	update(physObj, time) {}
}

function getFallV(vy, timeDelta, gravity) {
	gravity = gravity ?? (vy > 0 ? GRAVITY_COMING_DOWN : GRAVITY_GOING_UP);
	return Math.min(MAXFALL, vy + timeDelta * gravity);
}

export {
    PhysObj,
	RectHitbox,
	DummyCollisionHandler,
	DummyCollidableProvider,
	DummyUpdateHandler,

	GRAVITY_COMING_DOWN,
	GRAVITY_GOING_UP,
	getFallV
}


// class Solid extends PhysObj {
// 	constructor(hitbox, collidable, level) {
// 		super(hitbox, collidable, level);
// 	}


	
// 	move(moveX, moveY) {
// 		let remainderX = Math.round(moveX);
// 		let remainderY = Math.round(moveY);
// 		if (remainderX !== 0 || remainderY !== 0) {
// 			const ridingActors = super.getLevel().getAllRidingActors(this);
// 			const prevCollide = this.collidable;
// 			this.collidable = false;
// 			if (remainderX !== 0) {
// 				super.incrX(remainderX);
// 				//Warning: if a solid tunnels through an object, the object won't get pushed
// 				//That's probably fine for now
// 				super.getLevel().getActors().forEach(actor => {
// 					if (actor in ridingActors) {
// 						actor.moveX(remainderX, actor.onCollide);
// 					} else if (this.getHitbox().isOverlap(actor.getHitbox())) {
// 						actor.moveX(super.getX() + super.getWidth() - actor.getX(), actor.squish)
// 					}
// 				});
// 			}

// 			if (remainderY !== 0) {
// 				super.incrY(remainderY);
// 				super.getLevel().getActors().forEach(actor => {
// 					if (actor in ridingActors) {
// 						actor.moveY(remainderY, actor.onCollide);
// 					} else if (this.getHitbox().isOverlap(actor.getHitbox())) {
// 						const moveUp = remainderY > 0 ? super.getY() - super.getHeight() - actor.getY() : super.getY() - actor.getY() - actor.getHeight();
// 						actor.moveY(moveUp, actor.squish)
// 					}
// 				});
// 			}
// 			this.collidable = prevCollide;
// 		}
// 	}

// 	//onPlayerCollide() {return "wall";}
// }

// class Actor extends PhysObj {
// 	constructor(x, y, w, h, collidable, level) {
// 		super(x, y, w, h, collidable, level);
// 		this.spawn = Vector({x: x, y: y});
// 		this.origW = w;
// 		this.origH = h;
// 		this.subpixelX = 0;
// 		this.subpixelY = 0;
// 	}

// 	//Moves the actor by [amount] pixels and calls [onCollide] after collision with any object
// 	moveX(amount, onCollide) {
// 		let remainder = Math.round(amount + this.subpixelX);
// 		this.subpixelX = (amount + this.subpixelX) - remainder;
// 		const direction = Vector({x: amount < 0 ? -1 : 1, y: 0});

// 		if (remainder !== 0) {
// 			const ridingActors = super.getLevel().getAllRidingActors(this);
// 			while (remainder !== 0) {
// 				let collideObjs = this.collideOffset(direction);
// 				let shouldBreak = false;
// 				const runCollisionObjs = [];
// 				collideObjs.some(c => {
// 					if (c && onCollide(c)) {
// 						runCollisionObjs.push(c);
// 						shouldBreak = true;
// 						return true;
// 					}
// 				});
// 				if (shouldBreak) {
// 					break;
// 				}

// 				super.incrX(direction.x);
// 				ridingActors.forEach(actor => {
// 					actor.moveX(direction.x, actor.onCollide);
// 				});
// 				remainder -= direction.x;
// 			}
// 		}
// 	}

// 	moveY(amount, onCollide) {
// 		let remainder = Math.round(amount + this.subpixelY);
// 		this.subpixelY = (amount + this.subpixelY) - remainder;
// 		const direction = Vector({y: amount < 0 ? -1 : 1, x: 0});
// 		if (remainder !== 0) {
// 			while (remainder !== 0) {
// 				let collideObjs = this.collideOffset(direction);
// 				let shouldBreak = false;
// 				const runCollisionObjs = [];
// 				collideObjs.some(c => {
// 					if (c && onCollide(c)) {
// 						runCollisionObjs.push(c);
// 						shouldBreak = true;
// 						return true;
// 					}
// 				});
// 				if (shouldBreak) {
// 					break;
// 				}

// 				const ridingActors = super.getLevel().getAllRidingActors(this);

// 				super.incrY(direction.y);

// 				if (direction.y > 0) {
// 					ridingActors.forEach(a => a.moveY(direction.y, a.onCollide));
// 				}
// 				remainder -= direction.y;
// 			}
// 		}
// 	}

// 	isOnGround() {
// 		return (super.getLevel().isOnGround(this));
// 	}

// 	isOnIce() {
// 		return (super.getLevel().isOnIce(this));
// 	}

// 	isBonkHead() {
// 		return (super.getLevel().isBonkHead(this));
// 	}

// 	isPushUp() {
// 		return (super.getLevel().isPushUp(this));
// 	}

// 	isRiding(solid) {
// 		return (this.getHitbox().isOnTopOf(solid.getHitbox()));
// 	}

// 	onCollide(physObj) {
// 		console.error("Implement method onCollide");
// 		console.trace();
// 		console.log("physObj:", physObj);
// 		console.log("This: ", this);
// 	}

// 	squish(physObj) {
// 		throw new Error("implement method squish in subclass actor");
// 	}

// 	move(x, y) {
// 		this.moveX(x, this.onCollide);
// 		this.moveY(y, this.onCollide);
// 	}
// }
