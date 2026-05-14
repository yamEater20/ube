import {
	Vector,
	Rectangle,
} from './math.js';

import {camera} from "./camera.js";
import { Entity } from './entity.js';

const MAXFALL = 0.2;
const GRAVITY_GOING_UP = 4.4 / 10000;
const GRAVITY_COMING_DOWN = 8 / 10000;

class RectHitbox extends Entity {
    constructor(parent, relativePosition, width, height) {
		super(parent, relativePosition);
        this.rect = new Rectangle(width, height);
		this.width = width;
		this.height = height;
    }

    toString() {
        return `${this.rect.toString()}`
    }
	
	isOverlap(hitbox) {
		const pos = this.globalPosition();
		const otherPos = hitbox.globalPosition();
		let x = pos.x;
		let y = pos.y;
		let rx = otherPos.x;
		let ry = otherPos.y;
		return (x < rx + hitbox.width &&
			x + this.width > rx &&
			y < ry + hitbox.height &&
			y + this.height > ry);
	}

	isTouching(hitbox) {
		return (
			this.isOnTopOf(hitbox) ||
			this.isUnder(hitbox) ||
			this.isLeftOf(hitbox) ||
			this.isRightOf(hitbox)
		)
	}

	isOnTopOf(hitbox) {
		const otherPos = hitbox.globalPosition();
		const pos = this.globalPosition();
		return (
			otherPos.y + this.height === otherPos.y &&
			pos.x + this.width > pos.x &&
			pos.x + hitbox.width > pos.x
		);
	}

	isLeftOf(hitbox) {
		const pos = this.globalPosition();
		const otherPos = hitbox.globalPosition();
		let x = pos.x;
		let y = pos.y;
		return (
			x + this.width === otherPos.x &&
			y < otherPos.y + hitbox.height &&
			y + this.height > otherPos.y
		);
	}

	isUnder(hitbox) {
		return hitbox.isOnTopOf(this);
	}

	isRightOf(hitbox) {
		return hitbox.isLeftOf(this);
	}

    cloneOffset(v) {
        return new RectHitbox(this.parent, this.relativePosition.addPoint(v), this.width, this.height);
    }
}

class PhysObj {
	constructor(x, y, w, h, collidable, level, direction) {
		this.hitbox = new RectHitbox(x, y, w, h);
		this.direction = direction;
		this.level = level;
		this.collidable = collidable;
		this.velocity = Vector({x: 0, y: 0});

		//TODO: Use a hashmap/dictionary
		this.colliderBehaviors = [];
		this.collideeBehaviors = [];
		this.camera = camera;
	}

	incrX(dx) {
		this.relativePosition.x += dx;
	}

	incrY(dy) {
		this.relativePosition.y += dy;
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
		this.move(this.velocity.x * time.delta, this.velocity.y * time.delta);
	}

	move(x, y) {
		throw new Error("implement move in subclass PhysObj");
	}

	isOverlap(physObj, offset) {
		return this !== physObj && this.hitbox.cloneOffset(offset).isOverlap(physObj.getHitbox())
	}

	isOnTopOf(physObj) {
		return this.hitbox.isOnTopOf(physObj.hitbox);
	}

	isUnder(physObj) {
		return this.hitbox.isUnder(physObj.hitbox);
	}

	isLeftOf(physObj) {
		return this.hitbox.isLeftOf(physObj.hitbox);
	}

	isRightOf(physObj) {
		return this.hitbox.isRightOf(physObj.hitbox);
	}

	checkBehavior(funcName, ...args) {
		return this.colliderBehaviors.some(
			b => b[funcName] && b[funcName](...args)
		);
	}
}

class Solid extends PhysObj {
	constructor(x, y, w, h, collidable, level, direction) {
		super(x, y, w, h, collidable, level, direction);
	}

	move(moveX, moveY) {
		let remainderX = Math.round(moveX);
		let remainderY = Math.round(moveY);
		if (remainderX !== 0 || remainderY !== 0) {
			const ridingActors = super.getLevel().getAllRidingActors(this);
			const prevCollide = this.collidable;
			this.collidable = false;
			if (remainderX !== 0) {
				super.incrX(remainderX);
				//Warning: if a solid tunnels through an object, the object won't get pushed
				//That's probably fine for now
				super.getLevel().getActors().forEach(actor => {
					if (actor in ridingActors) {
						actor.moveX(remainderX, actor.onCollide);
					} else if (this.getHitbox().isOverlap(actor.getHitbox())) {
						actor.moveX(super.getX() + super.getWidth() - actor.getX(), actor.squish)
					}
				});
			}

			if (remainderY !== 0) {
				super.incrY(remainderY);
				super.getLevel().getActors().forEach(actor => {
					if (actor in ridingActors) {
						actor.moveY(remainderY, actor.onCollide);
					} else if (this.getHitbox().isOverlap(actor.getHitbox())) {
						const moveUp = remainderY > 0 ? super.getY() - super.getHeight() - actor.getY() : super.getY() - actor.getY() - actor.getHeight();
						actor.moveY(moveUp, actor.squish)
					}
				});
			}
			this.collidable = prevCollide;
		}
	}

	//onPlayerCollide() {return "wall";}
}

class Actor extends PhysObj {
	constructor(x, y, w, h, collidable, level, direction) {
		super(x, y, w, h, collidable, level, direction);
		this.spawn = Vector({x: x, y: y});
		this.origW = w;
		this.origH = h;
		this.subpixelX = 0;
		this.subpixelY = 0;
	}

	//Moves the actor by [amount] pixels and calls [onCollide] after collision with any object
	moveX(amount, onCollide) {
		let remainder = Math.round(amount + this.subpixelX);
		this.subpixelX = (amount + this.subpixelX) - remainder;
		const direction = Vector({x: amount < 0 ? -1 : 1, y: 0});

		if (remainder !== 0) {
			const ridingActors = super.getLevel().getAllRidingActors(this);
			while (remainder !== 0) {
				let collideObjs = this.collideOffset(direction);
				let shouldBreak = false;
				const runCollisionObjs = [];
				collideObjs.some(c => {
					if (c && onCollide(c)) {
						runCollisionObjs.push(c);
						shouldBreak = true;
						return true;
					}
				});
				if (shouldBreak) {
					break;
				}

				super.incrX(direction.x);
				ridingActors.forEach(actor => {
					actor.moveX(direction.x, actor.onCollide);
				});
				remainder -= direction.x;
			}
		}
	}

	moveY(amount, onCollide) {
		let remainder = Math.round(amount + this.subpixelY);
		this.subpixelY = (amount + this.subpixelY) - remainder;
		const direction = Vector({y: amount < 0 ? -1 : 1, x: 0});
		if (remainder !== 0) {
			while (remainder !== 0) {
				let collideObjs = this.collideOffset(direction);
				let shouldBreak = false;
				const runCollisionObjs = [];
				collideObjs.some(c => {
					if (c && onCollide(c)) {
						runCollisionObjs.push(c);
						shouldBreak = true;
						return true;
					}
				});
				if (shouldBreak) {
					break;
				}

				const ridingActors = super.getLevel().getAllRidingActors(this);

				super.incrY(direction.y);

				if (direction.y > 0) {
					ridingActors.forEach(a => a.moveY(direction.y, a.onCollide));
				}
				remainder -= direction.y;
			}
		}
	}

	isOnGround() {
		return (super.getLevel().isOnGround(this));
	}

	isOnIce() {
		return (super.getLevel().isOnIce(this));
	}

	isBonkHead() {
		return (super.getLevel().isBonkHead(this));
	}

	isPushUp() {
		return (super.getLevel().isPushUp(this));
	}

	isRiding(solid) {
		return (this.getHitbox().isOnTopOf(solid.getHitbox()));
	}

	onCollide(physObj) {
		console.error("Implement method onCollide");
		console.trace();
		console.log("Physobj:", physObj);
		console.log("This: ", this);
	}

	getFallV(gravity) {
		let newV = this.velocity.y + TrueTime.delta * gravity;
		if (newV > MAXFALL) newV = Math.max(MAXFALL, newV - 0.01 * TrueTime.delta);
		return newV;
	}

	defaultFall() {
		let newV = this.getFallV(this.velocity.y > 0 ? GRAVITY_COMING_DOWN : GRAVITY_GOING_UP)
		if (newV > MAXFALL) newV = Math.max(MAXFALL, newV - 0.01 * TrueTime.delta);
		
		this.setYVelocity(newV);
	}

	squish(physObj) {
		throw new Error("implement method squish in subclass actor");
	}

	getCarrying() {
		return null;
	}

	move(x, y) {
		this.moveX(x, this.onCollide);
		this.moveY(y, this.onCollide);
	}

	reset() {
		this.setX(this.spawn.x);
		this.setY(this.spawn.y);

		this.setXVelocity(0);
		this.setYVelocity(0);
	}

	addToLevel(level) {
		level.pushActor(this);
	}
}

export {
    PhysObj,
	Solid,
	Actor,

	GRAVITY_COMING_DOWN,
	GRAVITY_GOING_UP
}