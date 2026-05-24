export const AdjectiveIds = Object.freeze({
    GROUND: 0,
    WALL: 1,
    RIDABLE: 2,
    PUSHABLE_BOX: 3,
});

function adjectiveListIntoDictionary(adjectives) {
    const ret = {};
    adjectives.forEach(a => {
        const id = a.id();
        if (ret[id]) {
            throw new Error(`Duplicate Adjective Ids for ${adjectiveName(id)}: current ${ret[id]}, new ${a}.\nI can't imagine why you'd want this.`);
        }
        ret[id] = a;
    });
    return ret;
}

export function adjectiveName(id) {
    Object.keys(AdjectiveIds).find(k => AdjectiveIds[k] === id);
}

export class AdjectiveOnly {
    constructor(adjectives) {
        this.adjectives = adjectiveListIntoDictionary(adjectives);
    }

    containsAdjective(adjective) {
        return this.adjectives[adjective] != undefined;
    }

    onCollide() {
        throw new Error("You are calling onCollide from something that's not supposed to be moving.");
    }
}

export class Composite {
    constructor (adjectives, reactions) {
        this.adjectives = adjectiveListIntoDictionary(adjectives);
        this.reactions = reactions;
    }

    containsAdjective(adjective) {
        return this.adjectives[adjective] != undefined;
    }

    intoDictionary(collisionPieces) {
        const ret = {};
        collisionPieces.forEach(p => {
            const id = p.id();
            if (id) {
                throw new Error(`Duplicate Adjective Ids for ${adjectiveName(id)}: current ${ret[id]}, new ${p}.\nI can't imagine why you'd want this.`);
            }
            ret[id] = p;
        });
    }

    onCollide(physObj, other, direction) {
		const otherAdjectives = other.collisionHandler.adjectives;
        const myReactions = physObj.collisionHandler.reactions;

        return myReactions.some(reaction => {
            const adjective = otherAdjectives[reaction.id()];
            if (adjective) {
                return reaction.react(physObj, other, adjective, direction);
            }
            return false;
        });
	}
}

export class GroundReaction {
    id() {return AdjectiveIds.GROUND;}

    react(physObj, other, ground, direction) {
        const canCollide = direction.y !== 0 && ground.isGround(physObj, direction);
        if (!canCollide) return false;
        if (direction.y < 0) {
            physObj.setYVelocity(Math.max(physObj.getYVelocity(), -0.05));
        } else if (direction.y > 0) {
            physObj.setYVelocity(0);
        }
        return true;
    }
}

export class Ground {
    id() {return AdjectiveIds.GROUND;}

    isGround(physObj, direction) {
        return true;
    }
}

export class WallReaction {
    id() {return AdjectiveIds.WALL;}

    react(physObj, other, wall, direction) {
        return direction.x !== 0;
    }
}

export class Wall {
    id() {return AdjectiveIds.WALL;}
}

export class Ridable {
    id() {return AdjectiveIds.RIDABLE;}
}

export class PushableBoxReaction {
    id() {return AdjectiveIds.PUSHABLE_BOX;}
    react(physObj, other, pushable, direction) {
        if (direction.x !== 0) {
            return other.moveDirection(direction.x, direction);
        }
        return false;
    }
}

export class PushableBox {
    id () {return AdjectiveIds.PUSHABLE_BOX;}
}