export const TAG_IDS = Object.freeze({
    GROUND: 0,
    WALL: 1,
    RIDABLE: 2,
    PUSHABLE_BOX: 3,
    ROOM: 4
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
        return this._tags[tag] != undefined;
    }

    onCollide() {
        throw new Error("You are calling onCollide from something that's not supposed to be moving.");
    }
}

export class Composite extends TagOnly {
    constructor (tags, reactions) {
        super(tags);
        this._reactions = reactions;
    }

    getReactions() {return this._reactions;}
    
    onCollide(physObj, other, direction) {
		const otherTags = other.collisionHandler.getTags();
        const myReactions = physObj.collisionHandler.getReactions();

        return myReactions.some(reaction => {
            const tag = otherTags[reaction.id()];
            if (tag) {
                return reaction.react(physObj, other, tag, direction);
            }
            return false;
        });
	}
}

export class GroundReaction {
    constructor(groundedProvider) {
        this._groundedProvider = groundedProvider;
    }
    
    id() {return TAG_IDS.GROUND;}

    react(physObj, other, ground, direction) {
        const canCollide = direction.y !== 0 && ground.isGround(physObj, direction);
        if (!canCollide) return false;

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
    id() {return TAG_IDS.GROUND;}

    isGround(physObj, direction) {
        return true;
    }
}

export class WallReaction {
    id() {return TAG_IDS.WALL;}

    react(physObj, other, wall, direction) {
        return direction.x !== 0;
    }
}

export class Wall {
    id() {return TAG_IDS.WALL;}
}

export class Ridable {
    id() {return TAG_IDS.RIDABLE;}
}

export class PushableBoxReaction {
    id() {return TAG_IDS.PUSHABLE_BOX;}
    react(physObj, other, pushable, direction) {
        if (direction.x !== 0) {
            return other.moveDirection(direction.x, direction);
        }
        return false;
    }
}

export class PushableBox {
    id () {return TAG_IDS.PUSHABLE_BOX;}
}

export class RoomCollider {
    constructor(roomIndex) {
        this.roomIndex = roomIndex;
    }
    id() {return TAG_IDS.ROOM;}
}

export class RoomColliderReaction {
    constructor(func) {
        this._handler = func;
    }
    id() {return TAG_IDS.ROOM;}
    react(physObj, other, room, direction) {
        this._handler(room);
        return false;
    }
}