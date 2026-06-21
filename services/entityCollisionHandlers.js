import { IReaction } from "./customCollisionHandlers.js";
import { directionToVector, VectorZero } from "../engine/math.js";

export const TAG_IDS = Object.freeze({
    GROUND: 0,
    WALL: 1,
    RIDABLE: 2,
    // PUSHABLE_BOX: 3,
    ROOM: 4,
    SPRING: 5,
    SPIKE: 6
});

export class GroundReaction extends IReaction {
    constructor(groundedProvider) {
        super();
        this._groundedProvider = groundedProvider;
    }

    id() { return TAG_IDS.GROUND; }

    react(physObj, other, ground, direction) {
        if (!ground.isGround(other, physObj, direction)) return;
        if (direction.y < 0) {
            if (this._groundedProvider.onGround(physObj)) {
                physObj.setYVelocity(0);
            } else {
                physObj.setYVelocity(Math.max(physObj.getYVelocity(), -0.05));
            }
        } else if (direction.y > 0) {
            physObj.setYVelocity(0);
        }
        return true;
    }
}

export class Ground {
    id() { return TAG_IDS.GROUND; }

    shouldStopMoving(tagPhysObj, movingPhysObj, direction) {
        return direction.y !== 0 && this.isGround(tagPhysObj, movingPhysObj, direction);
    }

    isGround(groundPhysObj, otherPhysObj, direction) {
        return true;
    }
}

export class WallReaction extends IReaction {
    id() { return TAG_IDS.WALL; }

    react(physObj, other, wall, direction) { }
}

export class Wall {
    id() { return TAG_IDS.WALL; }
    shouldStopMoving(tagPhysObj, movingPhysObj, direction) {
        return direction.x !== 0;
    }
}

export class Ridable {
    id() { return TAG_IDS.RIDABLE; }
}

// export class PushableBoxReaction {
//     id() {return TAG_IDS.PUSHABLE_BOX;}

//     react(physObj, other, pushable, direction) {
//         if (direction.x !== 0) {
//             return other.moveDirection(direction.x, direction);
//         }
//     }
// }

// export class PushableBox {
//     id () {return TAG_IDS.PUSHABLE_BOX;}
// }

export class RoomCollider {
    constructor(roomIndex) {
        this.roomIndex = roomIndex;
    }
    id() { return TAG_IDS.ROOM; }
    shouldStopMoving() { return false; }
}

export class RoomColliderReaction extends IReaction {
    constructor(func) {
        super();
        this._handler = func;
    }
    id() { return TAG_IDS.ROOM; }
    react(physObj, other, room, direction) {
        if (!physObj.isOverlap(other, VectorZero)) {
            this._handler(room);
        }
    }
}

export class Spring {
    constructor(bounceVelocity) {
        this.bounceVelocity = bounceVelocity;
    }
    id() { return TAG_IDS.SPRING; }
    shouldStopMoving(tagPhysObj, movingPhysObj, direction) { return direction.y > 0; }
    onBounce() {}
}

export class SpringReaction extends IReaction {
    id() { return TAG_IDS.SPRING; }
    react(physObj, other, spring, direction) {
        if (!physObj.isOverlap(other, VectorZero)) {
            physObj.setYVelocity(spring.bounceVelocity);
            spring.onBounce();
        }
    }
}

export class Spike {
    constructor(direction) {
        this.directionVector = directionToVector(direction);
    }
    id() { return TAG_IDS.Spike; }
    movingInto(otherVelocity) {
        const dot = this.directionVector.x * otherVelocity.x + this.directionVector.y * otherVelocity.y;
        return dot <= 0;
    }
    shouldStopMoving() { return false; }
}

export class SpikeReaction extends IReaction {
    id() { return TAG_IDS.Spike; }
}