import { ICollidable, ICollisionHandler } from "../engine/iCollisionHandler.js";

export class Tags extends ICollidable {
    constructor(tags) {
        super();
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
}

export class Reactions extends ICollisionHandler {
    constructor(reactions) {
        super();
        this._reactions = reactions;
    }

    getReactions() { return this._reactions; }

    onCollide(physObj, others, direction) {
        //Can't call this.getReactions() because decorators do not override.
        //I need to rethink this architecture.
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

export class Composite extends ICollisionHandler {
    constructor(tagCollider, reactionCollider) {
        super();
        this._tagCollider = tagCollider;
        this._reactionCollider = reactionCollider;
    }

    getTags() {return this._tagCollider.getTags();}
    containsTag(tag) {return this._tagCollider.containsTag(tag);}
    getTag(tag) {return this._tagCollider.getTag(tag);}

    getReactions() { return this._reactionCollider.getReactions(); }
    onCollide(physObj, others, direction) {return this._reactionCollider.onCollide(physObj, others, direction);}
}

export class IReaction {
    id() { throw new Error("Must implement"); }
    react(physObj, other, ground, direction) { throw new Error("Must implement"); }
}

function tagListIntoDictionary(tags) {
    const ret = {};
    tags.forEach(a => {
        const id = a.id();
        if (ret[id]) {
            throw new Error(`Duplicate Tag Ids for ${tagName(tags, id)}: current ${ret[id]}, new ${a}.\nI can't imagine why you'd want this.`);
        }
        ret[id] = a;
    });
    return ret;
}

export function tagName(tagIds, id) {
    Object.keys(tagIds).find(k => tagIds[k] === id);
}