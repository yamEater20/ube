import { directionToVector } from "./engine/math.js";

export const TAG_IDS = Object.freeze({
    GROUND: 0,
    WALL: 1,
    RIDABLE: 2,
    // PUSHABLE_BOX: 3,
    ROOM: 4,
    SPRING: 5,
    SPIKE: 6
});

function tagListIntoDictionary(tags) {
    const ret = {};
    tags.forEach(a => {
        const id = a.id();
        if (ret[id]) {
            throw new Error(`Duplicate Tag Ids for ${tagName(id)}: current ${ret[id]}, new ${a}.\nI can't imagine why you'd want this.`);
        }
        ret[id] = a;
    });
    return ret;
}

export function tagName(id) {
    Object.keys(TAG_IDS).find(k => TAG_IDS[k] === id);
}

export class TagOnly {
    constructor(tags) {
        this._tags = tagListIntoDictionary(tags);
    }

    getTags() {
        return this._tags;
    }

    containsTag(tag) {
        return this.getTag(tag) != undefined;
    }

    getTag(tag) {
        return this._tags[tag];
    }


    onCollide() {
        throw new Error("You are calling onCollide from something that's not supposed to be moving.");
    }
}

export class Composite extends TagOnly {
    constructor(tags, reactions) {
        super(tags);
        this._reactions = reactions;
    }

    getReactions() { return this._reactions; }

    onCollide(physObj, others, direction) {
        const myReactions = physObj.collisionHandler.getReactions();
        
        let allColliding = [];
        let stoppedAgainst = [];

        others.forEach(other => {
            const otherTags = other.collisionHandler.getTags();
            const myAllColliding = myReactions
                .map(reaction => {
                    return { tag: otherTags[reaction.id()], "reaction": reaction, other: other };
                })
                .filter(pair => pair.tag);

            allColliding = allColliding.concat(myAllColliding);
            
            stoppedAgainst = stoppedAgainst.concat(
                myAllColliding.filter(pair => pair.tag.shouldStopMoving(other, physObj, direction))
            );
        });

        if (stoppedAgainst.length === 0) {
            allColliding.forEach(pair => pair.reaction.react(physObj, pair.other, pair.tag, direction));
            return false;
        } else {
            stoppedAgainst.forEach(pair => pair.reaction.react(physObj, pair.other, pair.tag, direction));
            return true;
        }
    }
}

export class GroundReaction {
    constructor(groundedProvider) {
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

export class WallReaction {
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

export class RoomColliderReaction {
    constructor(func) {
        this._handler = func;
    }
    id() { return TAG_IDS.ROOM; }
    react(physObj, other, room, direction) {
        this._handler(room);
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

export class SpringReaction {
    id() { return TAG_IDS.SPRING; }
    react(physObj, other, spring, direction) {
        physObj.setYVelocity(spring.bounceVelocity);
        spring.onBounce();
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

export class SpikeReaction {
    id() { return TAG_IDS.Spike; }
}